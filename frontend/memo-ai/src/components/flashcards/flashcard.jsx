import React from 'react'
import { useState } from 'react'

const flashcard = ({flashcard,onToggleStar}) => {
    const [isFlipped,setIsFlipped]=useState(false);
    const handleFlip=()=>{
        setIsFlipped(!isFlipped);
    }
  return (
    <div>flashcard</div>
  )
}

export default flashcard