import supabase from '../services/supabaseService.js'

export async function getOrders(req, res) {
  try {
    const { data, error } = await supabase.from('orders').select('*')
    if (error) throw error
    res.json(data || [])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}

export async function createOrder(req, res) {
  try {
    const order = req.body
    const { data, error } = await supabase.from('orders').insert(order)
    if (error) throw error
    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}

export async function updateOrder(req, res) {
  try {
    const { id, ...rest } = req.body
    const { data, error } = await supabase.from('orders').update(rest).eq('id', id)
    if (error) throw error
    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}

export async function deleteOrder(req, res) {
  try {
    const { id } = req.body
        const { error: deleteError } = await supabase.from('orders').delete().eq('id', id)
    if (deleteError) throw deleteError
    res.json({ deleted: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}
