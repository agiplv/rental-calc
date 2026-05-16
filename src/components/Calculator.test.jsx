import React, { Fragment, act } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('framework7-react', () => {
  const frameworkOnlyBooleanProps = new Set([
    'accordionItem',
    'active',
    'clearButton',
    'dividersIos',
    'errorMessageForce',
    'fill',
    'inset',
    'large',
    'mediaList',
    'medium',
    'strong',
  ])

  const cleanProps = props =>
    Object.fromEntries(
      Object.entries(props).filter(
        ([key, value]) =>
          value !== undefined && !(typeof value === 'boolean' && frameworkOnlyBooleanProps.has(key))
      )
    )

  const wrap = Component => {
    const Wrapped = ({ children, ...props }) => <Component {...cleanProps(props)}>{children}</Component>
    const componentName =
      typeof Component === 'string' ? Component : Component.displayName || Component.name || 'Component'
    Wrapped.displayName = `Mock${componentName}`
    return Wrapped
  }

  return {
    AccordionContent: ({ children }) => <Fragment>{children}</Fragment>,
    Block: wrap('section'),
    BlockHeader: wrap('div'),
    Button: ({ children, onClick, type = 'button', ...props }) => (
      <button type={type} onClick={onClick} {...cleanProps(props)}>
        {children}
      </button>
    ),
    Card: wrap('article'),
    CardContent: wrap('div'),
    CardFooter: wrap('footer'),
    CardHeader: wrap('header'),
    Chip: ({ text }) => <span>{text}</span>,
    List: wrap('div'),
    ListInput: ({
      label,
      type,
      value,
      onInput,
      placeholder,
      inputProps = {},
      inputmode,
    }) => {
      const InputTag = type === 'textarea' ? 'textarea' : 'input'

      return (
        <label>
          <span>{label}</span>
          <InputTag
            aria-label={label}
            inputMode={inputmode}
            onInput={onInput}
            placeholder={placeholder}
            value={value}
            {...(type === 'textarea' ? inputProps : { type })}
          />
        </label>
      )
    },
    ListItem: ({ title, after, subtitle, footer, children }) => (
      <div>
        {title && <div>{title}</div>}
        {subtitle && <div>{subtitle}</div>}
        {after && <div>{after}</div>}
        {footer && <div>{footer}</div>}
        {children}
      </div>
    ),
    Segmented: wrap('div'),
    Tab: ({ children, id, tabActive, className }) => (
      <div id={id} className={`tab ${className || ''} ${tabActive ? 'tab-active' : ''}`.trim()}>
        {tabActive ? children : null}
      </div>
    ),
    Tabs: wrap('div'),
  }
})

import Calculator from './Calculator'

describe('Calculator', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('shows a saved result and switches to the results tab from the segmented control', async () => {
    const { container } = render(<Calculator />)

    await act(async () => {
      vi.advanceTimersByTime(350)
    })

    const inputsTab = container.querySelector('#tab-inputs')
    const resultsTab = container.querySelector('#tab-results')

    expect(inputsTab).toHaveClass('tab-active')
    expect(resultsTab).not.toHaveClass('tab-active')
    expect(screen.getByRole('button', { name: 'View detailed results' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Results' }))

    expect(inputsTab).not.toHaveClass('tab-active')
    expect(resultsTab).toHaveClass('tab-active')
    expect(screen.getByText('Monthly summary')).toBeInTheDocument()
  })

  it('switches to the results tab from the call-to-action button', async () => {
    const { container } = render(<Calculator />)

    await act(async () => {
      vi.advanceTimersByTime(350)
    })

    fireEvent.click(screen.getByRole('button', { name: 'View detailed results' }))

    expect(container.querySelector('#tab-results')).toHaveClass('tab-active')
    expect(screen.getByText('Goal achieved')).toBeInTheDocument()
  })
})
