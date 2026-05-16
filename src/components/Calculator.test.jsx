import React, { Fragment, act } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('framework7-react', () => {
  const frameworkSpecificProps = new Set([
    'accordionItem',
    'bottom',
    'clearButton',
    'deleteable',
    'mediaList',
    'noMarginBottom',
    'noMarginTop',
    'small',
    'tabbar',
    'tabLink',
    'tabActive',
    'tabLinkActive',
  ])

  const cleanProps = props =>
    Object.fromEntries(
      Object.entries(props).filter(
        ([key, value]) =>
          value !== undefined && !frameworkSpecificProps.has(key)
      )
    )

  const wrap = Component => {
    const Wrapped = ({ children, ...props }) => <Component {...cleanProps(props)}>{children}</Component>
    Wrapped.displayName = `Mock${typeof Component === 'string' ? Component : 'Component'}`
    return Wrapped
  }

  return {
    AccordionContent: ({ children }) => <Fragment>{children}</Fragment>,
    BlockTitle: ({ children }) => <h2>{children}</h2>,
    Button: ({ children, onClick, type = 'button', ...props }) => (
      <button type={type} onClick={onClick} {...cleanProps(props)}>
        {children}
      </button>
    ),
    Chip: ({ text }) => <span>{text}</span>,
    Link: ({ children, onClick, ...props }) => (
      <button type="button" onClick={onClick} {...cleanProps(props)}>
        {children}
      </button>
    ),
    List: wrap('div'),
    ListInput: ({ label, type, value, onInput, placeholder, inputProps = {}, inputmode, children }) => {
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
            {...(type === 'textarea' ? inputProps : { type, ...inputProps })}
          />
          {children}
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
    Tab: ({ children, id, tabActive, className }) => (
      <div id={id} className={`tab ${className || ''} ${tabActive ? 'tab-active' : ''}`.trim()}>
        {tabActive ? children : null}
      </div>
    ),
    Tabs: wrap('div'),
    Toolbar: wrap('div'),
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

  it('shows results tab content when switching from toolbar', async () => {
    const { container } = render(<Calculator />)

    await act(async () => {
      vi.advanceTimersByTime(350)
    })

    const inputsTab = container.querySelector('#tab-inputs')
    const resultsTab = container.querySelector('#tab-results')

    expect(inputsTab).toHaveClass('tab-active')
    expect(resultsTab).not.toHaveClass('tab-active')

    fireEvent.click(screen.getByRole('button', { name: /results/i }))

    expect(inputsTab).not.toHaveClass('tab-active')
    expect(resultsTab).toHaveClass('tab-active')
    expect(screen.getByText('Monthly summary')).toBeInTheDocument()
  })

  it('restores saved room data from localStorage', async () => {
    localStorage.setItem(
      'pea-rental-calc',
      JSON.stringify({
        rooms: [20, 10],
        monthlyFee: 300,
        tax: 0.2,
        profit: 0.1,
        investment: 12000,
        minProfit: 75,
        sizeWeight: 1,
      })
    )

    render(<Calculator />)

    await act(async () => {
      vi.advanceTimersByTime(350)
    })

    expect(screen.getByText('20 m²')).toBeInTheDocument()
    expect(screen.getByText('10 m²')).toBeInTheDocument()
    expect(screen.getByText('30.00 m²')).toBeInTheDocument()
  })

  it('shows validation feedback for invalid percentage input', async () => {
    render(<Calculator />)

    fireEvent.input(screen.getByLabelText('Tax'), { target: { value: '100' } })

    await act(async () => {
      vi.advanceTimersByTime(350)
    })

    fireEvent.click(screen.getByRole('button', { name: /results/i }))
    expect(screen.getByText('Check your inputs')).toBeInTheDocument()
  })

  it('shows room add guidance and appends a new room from input', async () => {
    render(<Calculator />)

    expect(screen.getByText('How to add rooms')).toBeInTheDocument()

    await act(async () => {
      fireEvent.input(screen.getByLabelText('New room area (m²)'), { target: { value: '22' } })
      fireEvent.click(screen.getByRole('button', { name: 'Add room' }))
      vi.advanceTimersByTime(350)
      vi.runOnlyPendingTimers()
    })

    expect(screen.getByText('22 m²')).toBeInTheDocument()
  })
})
