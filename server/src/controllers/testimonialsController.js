import supabase from '../services/supabaseService.js'

export async function getTestimonials(req, res) {
  try {
    const { data, error } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false })
    if (error) throw error
    res.json(data || [])
  } catch (err) {
    console.error('Testimonials error:', err)
    res.status(500).json({ error: err.message })
  }
}

export async function createTestimonial(req, res) {
  try {
    const testimonial = req.body
    const { data, error } = await supabase.from('testimonials').insert(testimonial).select().single()
    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    console.error('Create testimonial error:', err)
    res.status(500).json({ error: err.message })
  }
}

export async function updateTestimonial(req, res) {
  try {
    const { id, ...updates } = req.body
    const { data, error } = await supabase.from('testimonials').update(updates).eq('id', id).select().single()
    if (error) throw error
    res.json(data)
  } catch (err) {
    console.error('Update testimonial error:', err)
    res.status(500).json({ error: err.message })
  }
}

export async function deleteTestimonial(req, res) {
  try {
    const { id } = req.body
    const { error } = await supabase.from('testimonials').delete().eq('id', id)
    if (error) throw error
    res.json({ ok: true })
  } catch (err) {
    console.error('Delete testimonial error:', err)
    res.status(500).json({ error: err.message })
  }
}
