import dns from 'dns'

// Regex RFC 5322 simplifiée mais stricte
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

// Domaines de test / démo autorisés en local
const WHITELISTED_DOMAINS = new Set(['travelplan.tn', 'email.com', 'test.com', 'localhost'])

/**
 * Valide strictement une adresse email :
 * 1. Format & Syntaxe RFC
 * 2. Structure du domaine et extension TLD
 * 3. Enregistrements DNS MX réels et délivrabilité
 *
 * @param {string} email
 * @returns {Promise<{ isValid: boolean, error?: string, code?: string, normalizedEmail?: string, domain?: string }>}
 */
export async function validateEmailStrict(email) {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      error: 'Veuillez saisir une adresse email.',
      code: 'EMAIL_REQUIRED',
    }
  }

  const normalized = email.trim().toLowerCase()

  // 1. Longueur maximale
  if (normalized.length > 254) {
    return {
      isValid: false,
      error: 'L\'adresse email est trop longue (maximum 254 caractères).',
      code: 'EMAIL_TOO_LONG',
    }
  }

  // 2. Syntaxe & Regex RFC
  if (!EMAIL_REGEX.test(normalized)) {
    return {
      isValid: false,
      error: 'Format d\'adresse email invalide. Veuillez saisir une adresse réelle et valide (ex: exemple@gmail.com).',
      code: 'INVALID_EMAIL_FORMAT',
    }
  }

  const parts = normalized.split('@')
  if (parts.length !== 2) {
    return {
      isValid: false,
      error: 'L\'adresse email doit contenir un unique symbole "@".',
      code: 'INVALID_EMAIL_FORMAT',
    }
  }

  const [localPart, domain] = parts

  // 3. Règles supplémentaires sur la partie locale
  if (localPart.includes('..') || localPart.startsWith('.') || localPart.endsWith('.')) {
    return {
      isValid: false,
      error: 'L\'adresse email contient des points consécutifs ou mal placés.',
      code: 'INVALID_LOCAL_PART',
    }
  }

  // 4. Règles sur le domaine et TLD
  const domainParts = domain.split('.')
  if (domainParts.length < 2) {
    return {
      isValid: false,
      error: 'Le domaine de l\'adresse email est incomplet (extension manquante).',
      code: 'INVALID_DOMAIN_FORMAT',
    }
  }

  const tld = domainParts[domainParts.length - 1]
  if (!tld || tld.length < 2 || !/^[a-z]+$/i.test(tld)) {
    return {
      isValid: false,
      error: 'L\'extension du domaine (ex: .com, .fr, .tn) est invalide.',
      code: 'INVALID_TLD',
    }
  }

  // 5. Domaines de démo / développement
  if (WHITELISTED_DOMAINS.has(domain)) {
    return {
      isValid: true,
      normalizedEmail: normalized,
      domain,
    }
  }

  // 6. Vérification DNS des enregistrements MX (serveurs de messagerie réels)
  try {
    const mxRecords = await Promise.race([
      dns.promises.resolveMx(domain),
      new Promise((_, reject) =>
        setTimeout(() => {
          const timeoutErr = new Error('DNS_TIMEOUT')
          timeoutErr.code = 'ETIMEOUT'
          reject(timeoutErr)
        }, 3500)
      ),
    ])

    if (!mxRecords || mxRecords.length === 0) {
      // Fallback : vérifier si le domaine possède au moins un enregistrement A
      const aRecords = await dns.promises.resolve4(domain).catch(() => [])
      if (!aRecords || aRecords.length === 0) {
        return {
          isValid: false,
          error: 'Le domaine de cette adresse email n\'existe pas ou ne possède aucun serveur de messagerie (MX introuvable). Veuillez saisir une adresse réelle et valide.',
          code: 'DOMAIN_NO_MX',
        }
      }
    }

    return {
      isValid: true,
      normalizedEmail: normalized,
      domain,
    }
  } catch (err) {
    // Si le domaine n'existe pas sur les serveurs DNS
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA' || err.code === 'SERVFAIL' || err.code === 'EREFUSED') {
      return {
        isValid: false,
        error: 'Cette adresse email est inexistante ou mal orthographiée (le nom de domaine est introuvable). Veuillez renseigner une adresse email réelle et valide.',
        code: 'DOMAIN_NOT_FOUND',
      }
    }

    // En cas de timeout DNS ou problème réseau temporaire
    console.warn(`[EmailValidator] ⚠️ Vérification DNS MX non concluante (${err.code || err.message}) pour ${domain}. Validation de syntaxe conservée.`)
    return {
      isValid: true,
      normalizedEmail: normalized,
      domain,
    }
  }
}
