import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DndContext, rectIntersection } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useInterval } from 'react-use';

const words = [
  "PYTHON", "JAVASCRIPT", "REACT", "HTML", "CSS", "NODE", "GITHUB", "TAILWIND", "BOOTSTRAP", "VITE", "APPLE", "BANANA", "ASSESS"
];

function shuffleWord(word) {
  const letters = word.split('');
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  return letters.join('');
}

function generatePuzzle() {
  const selectedWords = [];
  const puzzle = [];
  while (selectedWords.length < 5) {
    const word = words[Math.floor(Math.random() * words.length)];
    if (!selectedWords.includes(word)) {
      selectedWords.push(word);
      puzzle.push({
        word: word,
        scrambled: shuffleWord(word),
        isCorrect: false,
      });
    }
  }
  return puzzle;
}

function SortableItem(props) {
  const {
    letter,
    isCorrect,
    id
  } = props;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: isCorrect ? 'green' : 'white',
    color: isCorrect ? 'white' : 'black',
    opacity: isCorrect ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="letter-tile"
    >
      {letter.split('-')[0]}
    </div>
  );
}

function Word({ wordData, items, setItems, isBlinking, setIsBlinking }) {
  const { word, scrambled, isCorrect } = wordData;

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active && over) {
      const oldIndex = items.indexOf(active.id);
      const newIndex = items.indexOf(over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
    }
  };

  useEffect(() => {
    const originalItems = items.map(item => item.split('-')[0]).join('');
    if (originalItems === word) {
      setIsBlinking(true);
    }
  }, [items, word, setIsBlinking]);

  useInterval(
    () => {
      setIsBlinking(false);
    },
    isBlinking ? 1000 : null
  );

  return (
    <div className="word-container">
      <DndContext collisionDetection={rectIntersection} onDragEnd={handleDragEnd}>
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className={`letter-tiles-container ${isBlinking ? 'blinking' : ''}`}>
            {items.map((letter, index) => (
              <SortableItem
                key={letter}
                id={letter}
                letter={letter}
                isCorrect={isCorrect}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function App() {
  const [puzzle, setPuzzle] = useState(generatePuzzle());
  const [solvedCount, setSolvedCount] = useState(0);
  const [showCongrats, setShowCongrats] = useState(false);

  const [wordStates, setWordStates] = useState(
    puzzle.map((wordData) => ({
      word: wordData.word,
      items: wordData.scrambled.split('').map((letter, index) => `${letter}-${index}`),
      isBlinking: false,
    }))
  );

  useEffect(() => {
    setWordStates(
      puzzle.map((wordData) => ({
        word: wordData.word,
        items: wordData.scrambled.split('').map((letter, index) => `${letter}-${index}`),
        isBlinking: false,
      }))
    );
    setSolvedCount(0);
    setShowCongrats(false);
  }, [puzzle]);

  useEffect(() => {
    if (solvedCount === 5) {
      setShowCongrats(true);
    }
  }, [solvedCount]);

  const handleNewSet = () => {
    setPuzzle(generatePuzzle());
  };

  const handleWordSolved = useCallback(() => {
    setSolvedCount((prevCount) => prevCount + 1);
  }, []);

  const updateWordState = (index, newItems) => {
    const newWordStates = [...wordStates];
    newWordStates[index].items = newItems;
    setWordStates(newWordStates);
  };

  const setBlinking = (index, isBlinking) => {
    const newWordStates = [...wordStates];
    newWordStates[index].isBlinking = isBlinking;
    setWordStates(newWordStates);
  };

  return (
    <div className="app">
      <h1>Word Unscramble</h1>
      {puzzle.map((wordData, index) => (
        <Word
          key={index}
          wordData={wordData}
          items={wordStates[index].items}
          setItems={(newItems) => {
            updateWordState(index, newItems);
            const originalItems = newItems.map(item => item.split('-')[0]).join('');
            if (originalItems === wordData.word) {
              handleWordSolved();
            }
          }}
          isBlinking={wordStates[index].isBlinking}
          setIsBlinking={(isBlinking) => {
            setBlinking(index, isBlinking);
          }}
        />
      ))}
      {showCongrats && <div className="congrats-message">Congrats! You finished this level!</div>}
      <button className="new-set-button" onClick={handleNewSet}>
        Give Me Another Set
      </button>
    </div>
  );
}

export default App;
