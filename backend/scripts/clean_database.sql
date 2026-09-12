-- =========================================================================
-- SCRIPT SQL DE NETTOYAGE SÉCURISÉ DES UTILISATEURS (POSTGRESQL / PGADMIN)
-- Conserve uniquement :
-- 1. L'administrateur : 'admin@travelplan.tn'
-- 2. Le voyageur : 'ahmed@email.com'
-- =========================================================================

BEGIN;

-- 1. Supprimer les paiements liés aux réservations des utilisateurs à supprimer
DELETE FROM "paiement"
WHERE "reservation_id" IN (
    SELECT id FROM "reservation"
    WHERE "user_id" IN (
        SELECT id FROM "user"
        WHERE email NOT IN ('admin@travelplan.tn', 'ahmed@email.com')
    )
);

-- 2. Supprimer les avis des utilisateurs à supprimer
DELETE FROM "avis"
WHERE "user_id" IN (
    SELECT id FROM "user"
    WHERE email NOT IN ('admin@travelplan.tn', 'ahmed@email.com')
);

-- 3. Supprimer les réservations des utilisateurs à supprimer
DELETE FROM "reservation"
WHERE "user_id" IN (
    SELECT id FROM "user"
    WHERE email NOT IN ('admin@travelplan.tn', 'ahmed@email.com')
);

-- 4. Supprimer les utilisateurs ciblés
DELETE FROM "user"
WHERE email NOT IN ('admin@travelplan.tn', 'ahmed@email.com');

COMMIT;

-- 5. Afficher les comptes conservés dans la table user
SELECT id, prenom, nom, email, role, is_verified FROM "user";
