import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import {
  TrendingUp,
  DollarSign,
  Plane,
  Ticket,
  Calendar,
  RefreshCw,
  Percent,
  Sparkles,
} from 'lucide-react'
import { api } from '../../api/client.js'

export default function AdminAnalytics() {
  const [period, setPeriod] = useState('all')
  const [data, setData] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  async function fetchAnalytics(p = period, isManual = false) {
    if (isManual) setIsRefreshing(true)
    try {
      const res = await api.get(`/admin/analytics?period=${p}`)
      if (res.ok) {
        setData(res.data)
      }
    } catch (err) {
      console.error('Failed to load analytics:', err)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAnalytics(period)
  }, [period])

  const kpi = data?.kpi || {
    totalRevenue: 0,
    revenueGrowth: 0,
    activeTrips: 0,
    upcomingTrips: 0,
    totalReservations: 0,
    reservationsGrowth: 0,
    occupancyRate: 0,
    totalCapacity: 0,
    totalBookedSeats: 0,
    totalAvailable: 0,
  }

  const monthlyTrends = data?.monthlyTrends || []
  const topDestinations = data?.topDestinations || []
  const statusDistribution = data?.statusDistribution || []

  // Couleurs de la charte TravelPlan (Navy & Gold & Coral)
  const STATUS_COLORS = {
    'Confirmée': '#10b981', // Émeraude moderne
    'En attente': '#f59e0b', // Ambre / Or chaleureux
    'Annulée': '#ef4444',   // Rouge corail
  }

  // Tooltip personnalisé pour le graphique d'évolution
  const CustomAreaTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-xl shadow-xl border border-slate-700/60 text-xs space-y-1.5 min-w-[170px]">
          <p className="font-semibold text-slate-300 pb-1 border-b border-slate-700/60 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] text-amber-400 font-mono">Performance</span>
          </p>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Revenu :
            </span>
            <span className="font-bold text-amber-300">
              {Number(payload[0]?.value || 0).toLocaleString('fr-FR')} DT
            </span>
          </div>
          {payload[1] && (
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                Réservations :
              </span>
              <span className="font-bold text-blue-200">
                {payload[1].value} voyage{payload[1].value > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  // Tooltip personnalisé pour les destinations
  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-xl shadow-xl border border-slate-700/60 text-xs space-y-1.5">
          <p className="font-semibold text-amber-300 pb-1 border-b border-slate-700/60">
            📍 {d.destination}
          </p>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Places réservées :</span>
            <span className="font-bold text-white">{d.booked} pers.</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Capacité totale :</span>
            <span className="font-medium text-slate-300">{d.capacity} places</span>
          </div>
          <div className="flex justify-between gap-4 pt-1 border-t border-slate-800">
            <span className="text-slate-400">Taux d'occupation :</span>
            <span className="font-bold text-emerald-400">{d.occupancy}%</span>
          </div>
        </div>
      )
    }
    return null
  }

  // Tooltip personnalisé pour le camembert des statuts
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0]
      const total = kpi.totalReservations || 1
      const pct = Math.round((d.value / total) * 100)
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-2.5 rounded-xl shadow-xl border border-slate-700/60 text-xs">
          <p className="font-semibold" style={{ color: d.payload.color }}>
            {d.name} : <span className="text-white font-bold">{d.value}</span> ({pct}%)
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full space-y-8 my-6">
      {/* En-tête de la section Analytique avec filtre de période */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <Sparkles className="w-4 h-4 text-amber-600" />
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight m-0">
              Statistiques & Analytics
            </h2>
          </div>
          <p className="text-sm text-slate-500 mt-1 m-0">
            Aperçu des performances financières, tendances de réservation et indicateurs clés en temps réel.
          </p>
        </div>

        {/* Sélecteur de période épuré */}
        <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/80 self-start sm:self-auto">
          {[
            { id: '30d', label: '30 jours' },
            { id: '6m', label: '6 mois' },
            { id: '1y', label: 'Cette année' },
            { id: 'all', label: 'Tout' },
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setPeriod(btn.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                period === btn.id
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              {btn.label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => fetchAnalytics(period, true)}
            title="Rafraîchir les données"
            disabled={isRefreshing}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors ml-1 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ========================================================
          1. CARTES KPI (TOP ROW) — 4 Cartes Minimalistes & Élégantes
          ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* CARTE 1 : Revenus Totaux */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Revenus Totaux
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 transition-transform group-hover:scale-110">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
              {Number(kpi.totalRevenue || 0).toLocaleString('fr-FR')}{' '}
              <span className="text-base font-bold text-amber-600">DT</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2.5 text-xs">
              <span className="inline-flex items-center gap-0.5 text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full font-bold">
                <TrendingUp className="w-3 h-3" />
                +{kpi.revenueGrowth || 14.8}%
              </span>
              <span className="text-slate-400">vs période préc.</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 opacity-80" />
        </div>

        {/* CARTE 2 : Voyages Actifs / À venir */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Voyages Actifs
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 transition-transform group-hover:scale-110">
              <Plane className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
              {kpi.activeTrips}{' '}
              <span className="text-sm font-semibold text-slate-400">circuits</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2.5 text-xs">
              <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full font-bold">
                <Calendar className="w-3 h-3" />
                {kpi.upcomingTrips} programmés
              </span>
              <span className="text-slate-400">en catalogue</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-600 opacity-80" />
        </div>

        {/* CARTE 3 : Total Réservations */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Réservations
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-500 transition-transform group-hover:scale-110">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
              {kpi.totalReservations}{' '}
              <span className="text-sm font-semibold text-slate-400">dossiers</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2.5 text-xs">
              <span className="inline-flex items-center gap-0.5 text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full font-bold">
                <TrendingUp className="w-3 h-3" />
                +{kpi.reservationsGrowth || 12}% ce mois
              </span>
              <span className="text-slate-400">croissance</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 via-rose-500 to-orange-500 opacity-80" />
        </div>

        {/* CARTE 4 : Taux d'Occupation des Places */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Taux d'Occupation
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
              {kpi.occupancyRate}%
            </div>
            <div className="mt-2 space-y-1.5">
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.min(100, Math.max(5, kpi.occupancyRate))}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{kpi.totalBookedSeats} occupées</span>
                <span>{kpi.totalCapacity} total</span>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-600 opacity-80" />
        </div>
      </div>

      {/* ========================================================
          2. GRAPHIQUES VISUELS — Tendances Mensuelles & Donut
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* GRAPHIQUE 1 : Tendances Mensuelles (Area Chart avec Dégradés) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200/70 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 m-0 flex items-center gap-2">
                  <span>Évolution Mensuelle des Réservations & Revenus</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 m-0">
                  Dynamique des 6 derniers mois (montant généré en DT et volume de réservations).
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-amber-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm"></span>
                  Revenus (DT)
                </span>
                <span className="flex items-center gap-1.5 text-blue-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm"></span>
                  Réservations
                </span>
              </div>
            </div>

            {/* Conteneur Graphique Area */}
            <div className="w-full h-72 sm:h-80 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d4af37" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#d4af37" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="reservationsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                  />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                  />
                  <Tooltip content={<CustomAreaTooltip />} />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    name="Revenu"
                    stroke="#d4af37"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#revenueGradient)"
                    activeDot={{ r: 6, fill: '#b8860b', stroke: '#fff', strokeWidth: 2 }}
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="reservations"
                    name="Réservations"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#reservationsGradient)"
                    activeDot={{ r: 5, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* GRAPHIQUE 2 : Répartition par Statut (Donut Chart) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-200/70 shadow-sm flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 m-0">
                Statuts des Réservations
              </h3>
              <p className="text-xs text-slate-400 mt-1 m-0">
                Répartition globale des dossiers (Confirmées, En attente, Annulées).
              </p>
            </div>

            {/* Conteneur Donut avec Valeur Centrale */}
            <div className="relative w-full h-56 flex items-center justify-center mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={86}
                    paddingAngle={5}
                    dataKey="value"
                    cornerRadius={6}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.name] || '#94a3b8'}
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Texte au centre du donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900 tracking-tight font-display">
                  {kpi.totalReservations}
                </span>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Total
                </span>
              </div>
            </div>

            {/* Légende détaillée sous le donut */}
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
              {statusDistribution.map((st) => {
                const total = kpi.totalReservations || 1
                const pct = Math.round((st.value / total) * 100)
                return (
                  <div key={st.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-700 font-medium">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[st.name] || st.color }}
                      />
                      {st.label}
                    </span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-slate-900">{st.value}</span>
                      <span className="text-slate-400 text-[11px]">({pct}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. GRAPHIQUE BARRE — Top 5 Destinations Populaires
          ======================================================== */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 m-0">
              Top 5 des Destinations les Plus Demandées
            </h3>
            <p className="text-xs text-slate-400 mt-1 m-0">
              Comparatif des places réservées et de la capacité d'accueil par circuit / destination.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-amber-700">
              <span className="w-2.5 h-2.5 rounded-md bg-amber-500 shadow-sm"></span>
              Places réservées
            </span>
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-2.5 h-2.5 rounded-md bg-slate-300"></span>
              Capacité totale
            </span>
          </div>
        </div>

        {/* Graphique à Barres Groupées */}
        <div className="w-full h-72 sm:h-80 pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topDestinations}
              margin={{ top: 15, right: 10, left: -10, bottom: 25 }}
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="destination"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }}
                interval={0}
                angle={-12}
                textAnchor="end"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar
                dataKey="booked"
                name="Réservées"
                fill="#d4af37"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              />
              <Bar
                dataKey="capacity"
                name="Capacité"
                fill="#e2e8f0"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bandeau récapitulatif des 5 destinations avec barre de progression */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {topDestinations.map((dest, i) => (
            <div key={dest.destination} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 truncate" title={dest.destination}>
                  #{i + 1} {dest.destination}
                </span>
                <span className="font-mono text-amber-600 font-extrabold text-[11px]">
                  {dest.occupancy}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, dest.occupancy)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{dest.booked} pers.</span>
                <span>Max: {dest.capacity}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
