'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { profileSchema, type ProfileInput } from '@/lib/validations'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { ProfilePictureUpload } from '@/components/settings/ProfilePictureUpload'

type ProfileSettingsFormProps = {
  initialData?: {
    name: string
    email: string
    agencyName?: string | null
    phone?: string | null
    address?: string | null
    profilePictureUrl?: string | null
  }
}

export function ProfileSettingsForm({ initialData }: ProfileSettingsFormProps) {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState(initialData?.email || '')

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          agencyName: initialData.agencyName || undefined,
          phone: initialData.phone || undefined,
          address: initialData.address || undefined,
          profilePictureUrl: initialData.profilePictureUrl || undefined,
        }
      : {
          name: '',
          agencyName: '',
          phone: '',
          address: '',
          profilePictureUrl: '',
        },
  })

  useEffect(() => {
    let active = true
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/user/profile')
        if (!res.ok) return
        const data = await res.json()
        if (!active) return
        setEmail(data.email)
        form.reset({
          name: data.name || '',
          agencyName: data.agencyName || undefined,
          phone: data.phone || undefined,
          address: data.address || undefined,
          profilePictureUrl: data.profilePictureUrl || undefined,
        })
      } catch {}
    }
    if (!initialData) fetchProfile()
    return () => {
      active = false
    }
  }, [initialData, form])

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [form.formState.isDirty])

  const onSubmit = async (values: ProfileInput) => {
    setLoading(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        toast.error('Failed to update profile')
        return
      }
      const data = await res.json()
      setEmail(data.email)
      form.reset({
        name: data.name,
        agencyName: data.agencyName || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
        profilePictureUrl: data.profilePictureUrl || undefined,
      })
      toast.success('Profile updated successfully')
    } catch (e) {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center gap-6">
              <ProfilePictureUpload
                value={form.watch('profilePictureUrl')}
                onChange={(url: string | undefined) => form.setValue('profilePictureUrl', url, { shouldDirty: true })}
              />
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Freelancer Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <FormField
                    control={form.control}
                    name="agencyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agency Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input value={email} disabled />
                    </FormControl>
                  </FormItem>
                </div>
                <div>
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea rows={4} placeholder="Your address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => form.reset()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !form.formState.isDirty}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}