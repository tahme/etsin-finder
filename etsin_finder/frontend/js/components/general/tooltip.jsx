import React from 'react'
import styled from 'styled-components'

const Tip = styled.div.attrs({
  bg: props => props.theme.color.darkgray,
  fg: props => props.theme.color.white,
})`
  display: inline-block;
  position: relative;
  color: inherit;
  background-color: transparent;
  &:before {
    font-size: 0.8em;
    transition: all 0.3s ease;
    opacity: 0;
    content: "${props => props.title}";
    padding: 0.1em 0.7em;
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translate(-50%, -6px);
    white-space: nowrap;
    color: ${props => props.fg};
    background-color: ${props => props.bg};
    border-radius: 5px;
  }
  &:after {
    transition: all 0.3s ease;
    opacity: 0;
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translate(-50%, 6px);
    content: ' ';
    border: 6px solid transparent;
    border-top-color: ${props => props.bg};
  }
  &:hover {
    &:before,
    &:after {
      opacity: 1;
    }
  }
`
const Tooltip = props => (
  <Tip {...props} aria-hidden="true">
    {props.children}
  </Tip>
)
export default Tooltip