import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MapPin, Calendar, Users, DollarSign, FileText, Car, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const offerRideSchema = z.object({
  fromLocation: z.string().min(2, 'Ville de départ requise'),
  toLocation: z.string().min(2, 'Ville d\'arrivée requise'),
  departureTime: z.string().min(1, 'Date et heure de départ requises'),
  availableSeats: z.number().min(1, 'Au moins 1 place').max(8, 'Maximum 8 places'),
  pricePerSeat: z.number().min(500, 'Prix minimum 500 FCFA').max(50000, 'Prix maximum 50,000 FCFA'),
  description: z.string().optional(),
})

type OfferRideFormData = z.infer<typeof offerRideSchema>

const OfferRide: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<OfferRideFormData>({
    resolver: zodResolver(offerRideSchema),
    defaultValues: {
      availableSeats: 3,
      pricePerSeat: 2000,
    },
  })

  const onSubmit = async (data: OfferRideFormData) => {
    if (!user) return

    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('rides')
        .insert([
          {
            driver_id: user.id,
            from_location: data.fromLocation,
            to_location: data.toLocation,
            departure_time: data.departureTime,
            available_seats: data.availableSeats,
            price_per_seat: data.pricePerSeat,
            description: data.description || null,
            status: 'active',
          },
        ])

      if (error) {
        console.error('Error creating ride:', error)
        alert('Erreur lors de la création du trajet')
      } else {
        setSuccess(true)
        reset()
        setTimeout(() => {
          navigate('/rides')
        }, 2000)
      }
    } catch (error) {
      console.error('Error creating ride:', error)
      alert('Erreur lors de la création du trajet')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Trajet publié avec succès !
            </h2>
            <p className="text-gray-600 mb-6">
              Votre trajet est maintenant visible par les autres utilisateurs. Vous allez être redirigé vers la liste des trajets.
            </p>
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  const minDateTime = new Date()
  minDateTime.setHours(minDateTime.getHours() + 1) // At least 1 hour from now
  const minDateTimeString = minDateTime.toISOString().slice(0, 16)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary-600 rounded-full">
              <Car className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Proposer un trajet
          </h1>
          <p className="text-xl text-gray-600">
            Partagez votre trajet et réduisez vos frais de transport
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Économisez</h3>
            <p className="text-sm text-gray-600">Partagez les frais de carburant et de péage</p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Rencontrez</h3>
            <p className="text-sm text-gray-600">Faites de nouvelles rencontres sympathiques</p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Car className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Contribuez</h3>
            <p className="text-sm text-gray-600">Réduisez l'impact environnemental</p>
          </div>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Ville de départ *
                </label>
                <input
                  {...register('fromLocation')}
                  type="text"
                  className={`input-field ${errors.fromLocation ? 'border-red-300' : ''}`}
                  placeholder="Ex: Abidjan, Plateau"
                />
                {errors.fromLocation && (
                  <p className="mt-1 text-sm text-red-600">{errors.fromLocation.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Ville d'arrivée *
                </label>
                <input
                  {...register('toLocation')}
                  type="text"
                  className={`input-field ${errors.toLocation ? 'border-red-300' : ''}`}
                  placeholder="Ex: Bouaké, Centre-ville"
                />
                {errors.toLocation && (
                  <p className="mt-1 text-sm text-red-600">{errors.toLocation.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Date et heure de départ *
              </label>
              <input
                {...register('departureTime')}
                type="datetime-local"
                min={minDateTimeString}
                className={`input-field ${errors.departureTime ? 'border-red-300' : ''}`}
              />
              {errors.departureTime && (
                <p className="mt-1 text-sm text-red-600">{errors.departureTime.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Le départ doit être programmé au moins 1 heure à l'avance
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="inline w-4 h-4 mr-1" />
                  Nombre de places disponibles *
                </label>
                <select
                  {...register('availableSeats', { valueAsNumber: true })}
                  className={`input-field ${errors.availableSeats ? 'border-red-300' : ''}`}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={num}>
                      {num} place{num > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
                {errors.availableSeats && (
                  <p className="mt-1 text-sm text-red-600">{errors.availableSeats.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="inline w-4 h-4 mr-1" />
                  Prix par place (FCFA) *
                </label>
                <input
                  {...register('pricePerSeat', { valueAsNumber: true })}
                  type="number"
                  min="500"
                  max="50000"
                  step="100"
                  className={`input-field ${errors.pricePerSeat ? 'border-red-300' : ''}`}
                  placeholder="2000"
                />
                {errors.pricePerSeat && (
                  <p className="mt-1 text-sm text-red-600">{errors.pricePerSeat.message}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Prix recommandé: 1500-3000 FCFA pour un trajet Abidjan-Bouaké
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="inline w-4 h-4 mr-1" />
                Description du trajet (optionnel)
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="input-field resize-none"
                placeholder="Ajoutez des détails sur votre trajet : point de rendez-vous, arrêts prévus, préférences de passagers, etc."
              />
              <p className="mt-1 text-sm text-gray-500">
                Une description détaillée aide les passagers à mieux comprendre votre trajet
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Conseils pour un trajet réussi :</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Soyez ponctuel au point de rendez-vous</li>
                <li>• Communiquez clairement avec vos passagers</li>
                <li>• Respectez les règles de sécurité routière</li>
                <li>• Gardez votre véhicule propre et en bon état</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary flex-1 flex justify-center items-center"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Publier mon trajet'
                )}
              </button>
              <button
                type="button"
                onClick={() => reset()}
                className="btn-secondary flex-1"
              >
                Réinitialiser
              </button>
            </div>
          </form>
        </div>

        {/* Safety Notice */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-900 mb-2">Rappel de sécurité :</h3>
          <p className="text-sm text-yellow-800">
            Assurez-vous que votre véhicule est en bon état, que votre assurance est à jour, 
            et que vous respectez le code de la route. La sécurité de vos passagers est votre responsabilité.
          </p>
        </div>
      </div>
    </div>
  )
}

export default OfferRide