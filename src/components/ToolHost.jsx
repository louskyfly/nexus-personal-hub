import { useEffect, useState } from 'react'
import { toolById } from '../lib/catalog'
import { useToast } from './Toast'
import { Modal } from './Modal'
import { ErrorBoundary, LoadingFrame } from './ui'
import { cn } from '../lib/utils'

export function ToolHost({ toolId, open, onClose }) {
  const tool = toolById(toolId)
  const [Component, setComponent] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    let cancelled = false
    setComponent(null)
    if (!tool) return undefined
    tool
      .load()
      .then((module) => {
        if (!cancelled) setComponent(() => module.default)
      })
      .catch((error) => {
        console.error(error)
        if (!cancelled) {
          toast({
            title: 'Outil indisponible',
            description: 'Le module n’a pas pu être chargé.',
            tone: 'error',
          })
        }
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolId])

  if (!tool) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Nexus Tools"
      title={tool.title}
      subtitle={tool.description}
      size="xl"
      className={cn('tool-modal', `tool-modal-${tool.id}`)}
    >
      <div className="tool-host">
        {Component ? (
          <ErrorBoundary key={toolId}>
            <Component />
          </ErrorBoundary>
        ) : (
          <LoadingFrame label={`Chargement de ${tool.title}…`} tall />
        )}
      </div>
    </Modal>
  )
}
