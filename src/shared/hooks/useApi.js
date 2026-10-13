import { useCallback, useEffect, useState } from 'react'

/**
 * โหลดข้อมูลด้วย GET: useApi(client, '/path')  — path ว่าง/null = ยังไม่โหลด
 * คืน { data, error, loading, reload }
 */
export function useApi(client, path) {
  const [state, setState] = useState({ data: null, error: null, loading: !!path })
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!path) { setState({ data: null, error: null, loading: false }); return }
    let live = true
    setState((s) => ({ ...s, loading: true, error: null }))
    client.get(path)
      .then((data) => live && setState({ data, error: null, loading: false }))
      .catch((e) => live && setState({ data: null, error: e.message, loading: false }))
    return () => { live = false }
  }, [client, path, tick])
  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { ...state, reload }
}
