import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Search, MapPin, Calendar, Users, DollarSign, Clock, User, Star, Filter } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const searchSchema = z.object({
  from: z.string().min(1, 'Ville de départ requise'),
  to: z.string().min(1, 'Ville d\'arrivée requise'),
  date: z.string().optional(),
  passengers: z.number().min(1).max(8).default(1),
})

type SearchFormData = z.infer<typeof searchSchema>

interface Ride {
  id: string
  driver_id: string
  from_location: string
  to_location: string
  departure_time: string
  available_seats: number
  price_per_seat: number
  description: string | null
  status: string
  profiles: {
    full_name: string
    avatar_url: string | null
  }
}

const Rides: React.FC = () => {
  const { user } = useAuth()
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      passengers: 1,
    },
  })

  const popularRoutes = [
    { from: 'Abidjan', to: 'Bouaké' },
    { from: 'Abidjan', to: 'Yamoussoukro' },
    { from: 'Abidjan', to: 'San-Pédro' },
    { from: 'Bouaké', to: 'Korhogo' },
    { from: 'Yamoussoukro', to: 'Bouaké' },
    { from: 'Abidjan', to: 'Daloa' },
  ]

  const searchRides = async (data: SearchFormData) => {
    setLoading(true)
    setSearchPerformed(true)

    try {
      let query = supabase
        .from('rides')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('status', 'active')
        .gte('available_seats', data.passengers)
        .ilike('from_location', `%${data.from}%`)
        .ilike('to_location', `%${data.to}%`)

      if (data.date) {
        const searchDate = new Date(data.date)
        const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0)).toISOString()
        const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999)).toISOString()
        query = query.gte('departure_time', startOfDay).lte('departure_time', endOfDay)
      } else {
        // Only show future rides if no specific date is selected
        query = query.gte('departure_time', new Date().toISOString())
      }

      const { data: ridesData, error } = await query.order('departure_time', { ascending: true })

      if (error) {
        console.error('Error fetching rides:', error)
      } else {
        setRides(ridesData || [])
      }
    } catch (error) {
      console.error('Error searching rides:', error)
    } finally {
      setLoading(false)
    }
  }

  const bookRide = async (rideId: string, seatsToBook: number, pricePerSeat: number) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('bookings')
        .insert([
          {
            ride_id: rideId,
            passenger_id: user.id,
            seats_booked: seatsToBook,
            total_price: seatsToBook * pricePerSeat,
            status: 'pending',
          },
        ])

      if (error) {
        console.error('Error booking ride:', error)
        alert('Erreur lors de la réservation')
      } else {
        alert('Réservation effectuée avec succès!')
        // Refresh the rides list
        const currentForm = watch()
        searchRides(currentForm)
      }
    } catch (error) {
      console.error('Error booking ride:', error)
      alert('Erreur lors de la réservation')
    }
  }

  const fillRoute = (from: string, to: string) => {
    const form = document.querySelector('form') as HTMLFormElement
    if (form) {
      const fromInput = form.querySelector('input[name="from"]') as HTMLInputElement
      const toInput = form.querySelector('input[name="to"]') as HTMLInputElement
      if (fromInput) fromInput.value = from
      if (toInput) toInput.value = to
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Rechercher un trajet
          </h1>
          <p className="text-xl text-gray-600">
            Trouvez le trajet parfait pour votre destination
          </p>
        </div>

        {/* Search Form */}
        <div className="card mb-8">
          <form onSubmit={handleSubmit(searchRides)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Départ
                </label>
                <input
                  {...register('from')}
                  type="text"
                  className={`input-field ${errors.from ? 'border-red-300' : ''}`}
                  placeholder="Ville de départ"
                />
                {errors.from && (
                  <p className="mt-1 text-sm text-red-600">{errors.from.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Arrivée
                </label>
                <input
                  {...register('to')}
                  type="text"
                  className={`input-field ${errors.to ? 'border-red-300' : ''}`}
                  placeholder="Ville d'arrivée"
                />
                {errors.to && (
                  <p className="mt-1 text-sm text-red-600">{errors.to.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Date (optionnel)
                </label>
                <input
                  {...register('date')}
                  type="date"
                  className="input-field"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="inline w-4 h-4 mr-1" />
                  Passagers
                </label>
                <select
                  {...register('passengers', { valueAsNumber: true })}
                  className="input-field"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={num}>{num} passager{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center space-x-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Rechercher</span>
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Filter className="w-5 h-5" />
                <span>Filtres</span>
              </button>
            </div>
          </form>
        </div>

        {/* Popular Routes */}
        {!searchPerformed && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Trajets populaires</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularRoutes.map((route, index) => (
                <button
                  key={index}
                  onClick={() => fillRoute(route.from, route.to)}
                  className="p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all duration-200 text-left group"
                >
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-primary-600" />
                    <span className="font-medium text-gray-900 group-hover:text-primary-600">
                      {route.from} → {route.to}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {searchPerformed && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {loading ? 'Recherche en cours...' : `${rides.length} trajet${rides.length > 1 ? 's' : ''} trouvé${rides.length > 1 ? 's' : ''}`}
              </h2>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : rides.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun trajet trouvé</h3>
                <p className="text-gray-600 mb-6">
                  Essayez de modifier vos critères de recherche ou consultez les trajets populaires.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {rides.map((ride) => (
                  <div key={ride.id} className="card hover:shadow-lg transition-shadow duration-200">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-primary-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {ride.profiles?.full_name || 'Conducteur'}
                            </h3>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm text-gray-600">4.8</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">Trajet</span>
                            </div>
                            <p className="font-medium text-gray-900">
                              {ride.from_location} → {ride.to_location}
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">Départ</span>
                            </div>
                            <p className="font-medium text-gray-900">
                              {format(new Date(ride.departure_time), 'dd MMM yyyy à HH:mm', { locale: fr })}
                            </p>
                          </div>
                        </div>

                        {ride.description && (
                          <p className="text-gray-600 mt-3 text-sm">{ride.description}</p>
                        )}
                      </div>

                      <div className="lg:text-right space-y-3">
                        <div className="flex lg:flex-col items-center lg:items-end space-x-4 lg:space-x-0 lg:space-y-2">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {ride.available_seats} place{ride.available_seats > 1 ? 's' : ''} disponible{ride.available_seats > 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span className="text-lg font-bold text-green-600">
                              {ride.price_per_seat.toLocaleString()} FCFA
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => bookRide(ride.id, watch('passengers'), ride.price_per_seat)}
                          disabled={ride.driver_id === user?.id}
                          className="btn-primary w-full lg:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {ride.driver_id === user?.id ? 'Votre trajet' : 'Réserver'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Rides