import React, { useEffect, useMemo, useRef, useState } from "react"
import axios from "axios"
import {
  RadioTower,
  Waves,
  Activity,
  Download,
  PauseCircle,
  PlayCircle,
  ListChecks,
  SignalHigh,
  Clipboard,
  Table as TableIcon,
} from "lucide-react"

const API = import.meta.env.VITE_API_BASE
const ACCENT = "#00B8B8"

export default function RxDashboard() {
  const [rxMessages, setRxMessages] = useState([])
  const [stats, setStats] = useState(null)
  const [live, setLive] = useState(true)
  const [limit, setLimit] = useState(50)

  const tableRef = useRef(null)

  const scrollToTable = () => {
    if (tableRef.current) {
      tableRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }

  const fetchData = async () => {
    try {
      const [messagesRes, statsRes] = await Promise.all([
        axios.get(`${API}/messages/?role=RX&limit=${limit}`),
        axios.get(`${API}/stats/`),
      ])
      setRxMessages(messagesRes.data || [])
      setStats(statsRes.data || {})
    } catch (error) {
      console.error("RX fetch failed:", error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [limit])

  useEffect(() => {
    if (!live) return
    const id = setInterval(fetchData, 3000)
    return () => clearInterval(id)
  }, [live, limit])

  const copyLastMessage = () => {
    if (!rxMessages.length) return
    const text = rxMessages[0].message || ""
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {})
    }
  }

  const exportCSV = () => {
    if (!rxMessages.length) return

    const rows = [
      ["id", "timestamp", "device", "msg_id", "message"],
      ...rxMessages.map((m) => [
        m.id ?? "",
        m.timestamp ?? "",
        m.device ?? "",
        m.msg_id ?? "",
        (m.message ?? "").replace(/\n/g, " "),
      ]),
    ]

    const csv = rows
      .map((r) =>
        r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n")

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `rx_messages_${new Date()
      .toISOString()
      .slice(0, 19)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const ratePerMin = useMemo(() => {
    if (!rxMessages.length) return 0
    const now = Date.now()
    const recent = rxMessages.filter((m) => {
      const t = new Date(m.timestamp).getTime()
      return Number.isFinite(t) && now - t <= 60_000
    })
    return recent.length
  }, [rxMessages])

  const lastMsgPreview =
    rxMessages.length > 0
      ? (() => {
          const msg = rxMessages[0].message || ""
          return msg.length > 80 ? msg.slice(0, 80) + "…" : msg || "-"
        })()
      : "-"

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* =============== HERO: RX CONSOLE =============== */}
      <section className="relative min-h-screen flex items-center px-6 py-10 overflow-hidden">
        {/* Base solid */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "#020817" }}
          aria-hidden="true"
        />

        {/* Background video layer 1 */}
        <video
          className="absolute inset-0 w-full h-full object-cover pointer-events-none mix-blend-screen"
          src="/bg1.mp4"
          autoPlay
          loop
          muted
          playsInline
          style={{ opacity: 0.35 }} // control opacity here
        />

        {/* Background video layer 2 */}
        <video
          className="absolute inset-0 w-full h-full object-cover pointer-events-none mix-blend-screen"
          src="/bg2.mp4"
          autoPlay
          loop
          muted
          playsInline
          style={{ opacity: 0.18 }} // slightly softer; tweak as needed
        />

        {/* Accent glows */}
        <div className="pointer-events-none absolute -top-40 -right-32 w-80 h-80 bg-[#00B8B8]/22 blur-3xl rounded-full" />
        <div className="pointer-events-none absolute -bottom-40 -left-32 w-80 h-80 bg-[#00B8B8]/10 blur-3xl rounded-full" />

        {/* Bottom fade for transition */}
        <div
          className="
            pointer-events-none absolute inset-0
            bg-gradient-to-b
            from-transparent
            via-[#020817F2]
            to-[#020817]
          "
        />

        {/* Content */}
        <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col gap-8">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-1">
            <img
              src="/logo.png"
              alt="Node Labs"
              className="w-24 h-24 object-contain"
            />
            <div className="flex flex-col">
              <span className="text-2xl font-semibold tracking-[0.22em] uppercase text-[#00B8B8]">
                Node Labs
              </span>
              <span className="text-[10px] text-slate-400">
                RF433 Mesh · Receiver Layer
              </span>
            </div>
          </div>

          {/* Heading row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center">
                <RadioTower className="w-10 h-10" color={ACCENT} />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#00B8B8]">
                  RF433 Receiver Console
                </h1>
                <p className="text-xs md:text-sm text-slate-300">
                  Inspect, pause, and export frames captured by your RX nodes.
                </p>
              </div>
            </div>

            <div className="hidden md:flex flex-col items-end gap-1 text-[9px] text-slate-400">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00B8B8] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00B8B8]" />
                </span>
                <span className="text-[#00B8B8]/80">
                  Live polling every 3s
                </span>
              </div>
              <span>{live ? "Streaming enabled" : "Paused snapshot"}</span>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-2">
            {/* RX Today */}
            <div className="rounded-3xl bg-slate-950/90 border border-[#00B8B8]/35 p-4 flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-2xl bg-[#00B8B8]/10 border border-[#00B8B8]/40 flex items-center justify-center">
                  <SignalHigh className="w-3.5 h-3.5" color={ACCENT} />
                </div>
                <span className="text-[9px] font-semibold tracking-[0.16em] uppercase text-[#00B8B8]">
                  RX Today
                </span>
              </div>
              <div className="mt-2 text-2xl md:text-3xl font-semibold text-[#00B8B8]">
                {stats?.received_today ?? stats?.sent_today ?? 0}
              </div>
              <p className="mt-1 text-[9px] text-slate-500">
                Frames ingested in the last 24 hours.
              </p>
            </div>

            {/* Total RX */}
            <div className="rounded-3xl bg-slate-950/90 border border-slate-700 p-4 flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center">
                  <ListChecks className="w-3.5 h-3.5 text-slate-100" />
                </div>
                <span className="text-[9px] font-semibold tracking-[0.16em] uppercase text-slate-300">
                  Total RX
                </span>
              </div>
              <div className="mt-2 text-2xl md:text-3xl font-semibold text-slate-100">
                {stats?.total_received ?? stats?.total_messages ?? 0}
              </div>
              <p className="mt-1 text-[9px] text-slate-500">
                All receiver posts stored by Node Labs.
              </p>
            </div>

            {/* Rate last min */}
            <div className="rounded-3xl bg-slate-950/90 border border-[#00B8B8]/25 p-4 flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-2xl bg-[#00B8B8]/8 border border-[#00B8B8]/30 flex items-center justify-center">
                  <Waves className="w-3.5 h-3.5" color={ACCENT} />
                </div>
                <span className="text-[9px] font-semibold tracking-[0.16em] uppercase text-[#00B8B8]">
                  Rate (60s)
                </span>
              </div>
              <div className="mt-2 text-2xl md:text-3xl font-semibold text-[#00B8B8]">
                {ratePerMin}/min
              </div>
              <p className="mt-1 text-[9px] text-slate-500">
                Messages received in the last minute.
              </p>
            </div>

            {/* Last message */}
            <div className="rounded-3xl bg-slate-950/90 border border-slate-700 p-4 flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5 text-[#00B8B8]" />
                </div>
                <span className="text-[9px] font-semibold tracking-[0.16em] uppercase text-slate-300">
                  Last Message
                </span>
              </div>
              <p className="mt-2 text-[9px] text-slate-300">
                {lastMsgPreview}
              </p>
              <button
                onClick={copyLastMessage}
                disabled={!rxMessages.length}
                className={`
                  mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl
                  text-[9px] font-semibold
                  ${
                    rxMessages.length
                      ? "bg-[#00B8B8]/10 text-[#00B8B8] hover:bg-[#00B8B8]/20"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed"
                  }
                `}
              >
                <Clipboard className="w-3 h-3" />
                Copy last
              </button>
            </div>
          </div>

          {/* Hero CTAs */}
          <div className="flex flex-wrap gap-3 justify-start md:justify-end">
            <button
              onClick={() => setLive((v) => !v)}
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] md:text-xs font-semibold
                ${
                  live
                    ? "bg-[#00B8B8] text-slate-950 hover:bg-[#02a1a1]"
                    : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                }
                transition-all shadow-md shadow-[#00B8B8]/25
              `}
            >
              {live ? (
                <>
                  <PauseCircle className="w-3.5 h-3.5" />
                  Pause live stream
                </>
              ) : (
                <>
                  <PlayCircle className="w-3.5 h-3.5" />
                  Resume live stream
                </>
              )}
            </button>

            <button
              onClick={fetchData}
              className="
                inline-flex items-center gap-2 px-4 py-2 rounded-2xl
                text-[10px] md:text-xs font-semibold
                bg-slate-900/90 text-slate-200 border border-slate-600
                hover:bg-slate-800 transition-all
              "
            >
              <Activity className="w-3.5 h-3.5" />
              Snapshot refresh
            </button>

            <button
              onClick={exportCSV}
              disabled={!rxMessages.length}
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-2xl
                text-[10px] md:text-xs font-semibold
                ${
                  rxMessages.length
                    ? "bg-[#00B8B8]/15 text-[#00B8B8] border border-[#00B8B8]/40 hover:bg-[#00B8B8]/25"
                    : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                }
                transition-all
              `}
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>

            <button
              onClick={scrollToTable}
              className="
                inline-flex items-center gap-2 px-4 py-2 rounded-2xl
                text-[10px] md:text-xs font-medium
                bg-transparent text-slate-300 border border-slate-700
                hover:bg-slate-900/70 transition-all
              "
            >
              <TableIcon className="w-3.5 h-3.5" />
              Jump to RX stream
            </button>
          </div>
        </div>
      </section>

      {/* =============== HOW RX WORKS =============== */}
      <section
        className="
          relative
          px-6 pt-16 pb-14
          bg-gradient-to-b
          from-[#020817]
          via-[#021B21]
          to-[#043F45]
          overflow-hidden
        "
      >
        {/* Blends */}
        <div
          className="
            pointer-events-none
            absolute top-0 left-0 right-0
            h-16
            bg-gradient-to-b
            from-[#020817]
            via-[#020817E6]
            to-transparent
          "
        />
        <div
          className="
            pointer-events-none
            absolute bottom-0 left-0 right-0
            h-16
            bg-gradient-to-t
            from-[#043F45]
            via-[#043F45]
            to-transparent
          "
        />

        {/* Glow */}
        <div
          className="
            pointer-events-none
            absolute inset-0
            bg-[radial-gradient(circle_at_top,_rgba(0,184,184,0.10),_transparent)]
          "
        />

        <div className="relative z-10 w-full max-w-6xl mx-auto grid md:grid-cols-[1.7fr,1.5fr] gap-10">
          {/* Narrative */}
          <div className="space-y-5">
            <h2 className="text-2xl md:text-3xl font-semibold text-[#F9FAFB] leading-tight">
              How the Node Labs{" "}
              <span className="text-[#00B8B8]">RF433 receiver path</span> works
            </h2>
            <p className="text-xs md:text-sm text-slate-300 max-w-xl">
              Every RF frame your mesh emits can be reconstructed, verified, and
              surfaced here. The RX console is the observability pane for your
              over-the-air traffic.
            </p>

            <div className="space-y-3 text-[11px] md:text-sm text-slate-200">
              <StepItem
                index={1}
                title="RF433 frames captured"
                text="RX nodes listen on your RF band and capture raw frames from nearby transmitters and repeaters."
              />
              <StepItem
                index={2}
                title="ESP32 RX reconstructs payloads"
                text="Frames are validated (IDs, CRC, routing) and rebuilt into application-level messages."
              />
              <StepItem
                index={3}
                title="Posted to Node Labs API"
                text="Structured payloads are POSTed to /api/rx with timestamps, devices, and metadata."
              />
              <StepItem
                index={4}
                title="Visualized in the Receiver Console"
                text="This dashboard polls RX records so you can pause, filter, export, and debug your mesh in real time."
              />
            </div>
          </div>

          {/* Layered cards */}
          <div className="space-y-3">
            <PipelineCard
              label="Stage 01"
              title="Air Interface → RX Frontend"
              highlight
              text="RF433 frames are captured at the edge, giving you raw visibility into your RF environment."
            />
            <PipelineCard
              label="Stage 02"
              title="Decode & Validate"
              text="ESP32 RX reconstructs packets, validates integrity, and discards corrupted noise."
            />
            <PipelineCard
              label="Stage 03"
              title="API Ingest"
              text="Clean messages are persisted by Node Labs with full context for analysis."
            />
            <PipelineCard
              label="Stage 04"
              title="Console & Export"
              text="The RX stream table shows the latest traffic; CSV export lets you take traces offline."
            />
          </div>
        </div>
      </section>

      {/* =============== RX CONTROLS + STREAM TABLE =============== */}
      <section
        className="
          relative
          px-6 pt-14 pb-16
          bg-gradient-to-b
          from-[#020817]
          via-[#020817]
          to-[#01060A]
          overflow-hidden
        "
      >
        {/* Top blend */}
        <div
          className="
            pointer-events-none
            absolute top-0 left-0 right-0
            h-16
            bg-gradient-to-b
            from-[#043F45]
            to-transparent
          "
        />

        {/* Glow */}
        <div
          className="
            pointer-events-none
            absolute inset-0
            bg-[radial-gradient(circle_at_bottom,_rgba(0,120,120,0.18),_transparent)]
          "
        />

        <div className="relative z-10 w-full max-w-5xl mx-auto space-y-4">
          {/* Controls row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLive((v) => !v)}
                className={`
                  inline-flex items-center gap-2 px-4 py-2 rounded-2xl
                  text-[10px] md:text-xs font-semibold
                  ${
                    live
                      ? "bg-[#00B8B8] text-slate-950 hover:bg-[#02a1a1]"
                      : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                  }
                  transition-all shadow-md shadow-[#00B8B8]/25
                `}
              >
                {live ? (
                  <>
                    <PauseCircle className="w-3.5 h-3.5" />
                    Pause live
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-3.5 h-3.5" />
                    Resume live
                  </>
                )}
              </button>

              <button
                onClick={fetchData}
                className="
                  inline-flex items-center gap-2 px-4 py-2 rounded-2xl
                  text-[10px] md:text-xs font-semibold
                  bg-slate-900/90 text-slate-200 border border-slate-600
                  hover:bg-slate-800 transition-all
                "
              >
                <Activity className="w-3.5 h-3.5" />
                Refresh once
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[9px] md:text-[10px]">
              <span className="text-slate-400">Show</span>
              <select
                value={limit}
                onChange={(e) =>
                  setLimit(parseInt(e.target.value, 10))
                }
                className="
                  bg-slate-950 border border-slate-700
                  rounded-2xl px-2 py-1 text-[9px] text-slate-200
                  focus:outline-none focus:ring-1 focus:ring-[#00B8B8]/70
                "
              >
                {[20, 50, 100, 200].map((n) => (
                  <option
                    key={n}
                    value={n}
                    className="bg-slate-900"
                  >
                    {n}
                  </option>
                ))}
              </select>

              <button
                onClick={copyLastMessage}
                disabled={!rxMessages.length}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl
                  font-semibold
                  ${
                    rxMessages.length
                      ? "bg-slate-900 text-slate-100 border border-slate-600 hover:bg-slate-800"
                      : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                  }
                `}
              >
                <Clipboard className="w-3 h-3" />
                Copy last
              </button>

              <button
                onClick={exportCSV}
                disabled={!rxMessages.length}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl
                  font-semibold
                  ${
                    rxMessages.length
                      ? "bg-[#00B8B8]/15 text-[#00B8B8] border border-[#00B8B8]/40 hover:bg-[#00B8B8]/25"
                      : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                  }
                `}
              >
                <Download className="w-3 h-3" />
                Export CSV
              </button>
            </div>
          </div>

          {/* RX Stream Table */}
          <div ref={tableRef}>
            {rxMessages.length === 0 ? (
              <div
                className="
                  mt-2 flex flex-col items-center justify-center gap-3
                  py-10 rounded-3xl
                  border border-dashed border-slate-700
                  bg-[#020817]/95
                "
              >
                <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center">
                  <RadioTower className="w-5 h-5 text-slate-500" />
                </div>
                <p className="text-xs md:text-sm text-slate-400 text-center px-6">
                  Waiting for receiver posts… once RF frames hit your RX node and
                  API, they’ll appear here in real time.
                </p>
              </div>
            ) : (
              <div
                className="
                  mt-2
                  rounded-3xl
                  border border-[#00B8B8]/18
                  bg-[#020817]/98
                  shadow-[0_18px_60px_rgba(0,0,0,0.7)]
                  overflow-hidden
                "
              >
                {/* Header strip */}
                <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00B8B8]" />
                    <span className="text-[9px] uppercase tracking-[0.16em] text-slate-400">
                      Live RX stream
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500">
                    Auto-refresh {live ? "on (3s)" : "paused"}
                  </span>
                </div>

                <table className="w-full text-[10px] md:text-xs">
                  <thead className="bg-slate-950/90 text-slate-400">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium">
                        Time
                      </th>
                      <th className="text-left px-4 py-2 font-medium">
                        Device
                      </th>
                      <th className="text-left px-4 py-2 font-medium">
                        Msg ID
                      </th>
                      <th className="text-left px-4 py-2 font-medium">
                        Message
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rxMessages.map((m, i) => (
                      <tr
                        key={m.id || `${m.timestamp}-${i}`}
                        className="
                          border-t border-slate-900/80
                          hover:bg-slate-900/80
                          transition-colors
                        "
                      >
                        <td className="px-4 py-2 text-slate-400 whitespace-nowrap">
                          {m.timestamp
                            ? new Date(
                                m.timestamp
                              ).toLocaleTimeString()
                            : "–"}
                        </td>
                        <td className="px-4 py-2 text-slate-200 whitespace-nowrap">
                          {m.device || "RX"}
                        </td>
                        <td className="px-4 py-2 text-slate-400 whitespace-nowrap">
                          {m.msg_id ?? "–"}
                        </td>
                        <td className="px-4 py-2 text-slate-100">
                          {(m.message || "").length > 120
                            ? (m.message || "").slice(0, 120) + "…"
                            : m.message || ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Help / flow hint */}
          <div
            className="
              mt-3 p-3.5
              rounded-2xl
              border border-[#00B8B8]/20
              bg-[#00B8B8]/5
              text-[9px] md:text-[10px]
              text-[#c6fdfd]
              flex items-start gap-2
            "
          >
            <Waves className="w-3.5 h-3.5 mt-0.5" color={ACCENT} />
            <p>
              The ESP32 receiver reconstructs messages from RF frames and POSTs
              them to <code className="px-1">/api/rx/</code>. This dashboard
              reads <code className="px-1">/messages?role=RX</code> and{" "}
              <code className="px-1">/stats</code> for a live view. Pause to
              inspect snapshots or export CSV for deeper analysis.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

/* Helpers */

function StepItem({ index, title, text }) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 h-5 w-5 rounded-full bg-[#00B8B8]/90 text-[10px] flex items-center justify-center font-bold text-slate-950">
        {index}
      </div>
      <div>
        <p className="font-semibold text-[#00B8B8]">{title}</p>
        <p className="text-slate-400">{text}</p>
      </div>
    </div>
  )
}

function PipelineCard({ label, title, text, highlight }) {
  return (
    <div
      className={`
        rounded-3xl px-4 py-3 flex flex-col gap-1
        ${
          highlight
            ? "bg-gradient-to-r from-[#00B8B8]/16 via-[#020817] to-[#020817] border border-[#00B8B8]/40"
            : "bg-slate-950/85 border border-slate-800"
        }
      `}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold text-slate-100">
          {title}
        </p>
        <span
          className={`
            text-[9px]
            ${highlight ? "text-[#00B8B8]" : "text-slate-500"}
          `}
        >
          {label}
        </span>
      </div>
      <p className="text-[10px] text-slate-400">{text}</p>
    </div>
  )
}
