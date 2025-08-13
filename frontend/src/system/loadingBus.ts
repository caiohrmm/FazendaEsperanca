type Handler = () => void

let handleStart: Handler = () => {}
let handleEnd: Handler = () => {}

export const loadingBus = {
  start() { try { handleStart() } catch {} },
  end() { try { handleEnd() } catch {} },
  setHandlers(start: Handler, end: Handler) {
    handleStart = start
    handleEnd = end
  }
}


