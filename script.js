// import { dictionaryApiKey } from "./hidden/apis.js";

const keys = Array.from(document.querySelectorAll(".key"));
const myAlert = document.querySelector(".alert");
const loader = document.querySelector(".loading");
const playBtn = document.querySelector(".play-again");
const submitBtn = document.querySelector(".key-submit");
const streak = document.querySelector(".score");

const MAIN = {
  wordToGuess: "",
  wordLength: 5,
  rowToStart: 1,
  currentSquare: 0,
  streak: 0,
  keepWinning: false,
  currentWordTyped: "",
  gameOver: false,
  wordsAlreadyGuessed: [],
  row1: document.querySelector(".row1"),
  row2: document.querySelector(".row2"),
  row3: document.querySelector(".row3"),
  row4: document.querySelector(".row4"),
  row5: document.querySelector(".row5"),
  row6: document.querySelector(".row6"),
};

const { wordLength } = MAIN;

let timerId;

function resetGameState() {
  MAIN.rowToStart = 1;
  MAIN.currentSquare = 0;
  if (!MAIN.keepWinning) {
    MAIN.streak = 0;
    streak.textContent = MAIN.streak;
  }
  MAIN.currentWordTyped = "";
  MAIN.gameOver = false;
  MAIN.wordsAlreadyGuessed = [];
}

async function startGame() {
  loader.style.display = "flex";
  if (timerId) clearTimeout(timerId);
  playBtn.style.display = "none";
  myAlert.style.opacity = 0;
  clearBoard();
  resetGameState();
  const word = await getNewWord();
  MAIN.wordToGuess = word;
  loader.style.display = "none";
}

async function checkSquare(key) {
  const currentRow = MAIN[`row${MAIN.rowToStart}`].children;
  if (key === "⬅︎") {
    // backspace was pressed
    if (MAIN.currentSquare === 0) return;
    if (MAIN.currentSquare > 0) MAIN.currentSquare--;
    currentRow[MAIN.currentSquare].textContent = "";
    MAIN.currentWordTyped = MAIN.currentWordTyped.slice(0, -1);
  } else if (key === "Submit") {
    // enter was pressed
    if (MAIN.currentWordTyped.length < wordLength) return;
    const res = await checkWordValidity(MAIN.currentWordTyped);
    if (!res || MAIN.wordsAlreadyGuessed.includes(MAIN.currentWordTyped)) {
      setTimer(() => {
        const text = !res ? "Invalid word" : "Word already guessed";
        showAlert(text, !res ? 2 : 1, true);
      }, 10);
      clearRow(currentRow);
    } else {
      validifyRow();
    }
  } else {
    // letter was pressed
    if (MAIN.currentSquare > wordLength - 1) return;
    currentRow[MAIN.currentSquare].textContent = key;
    MAIN.currentWordTyped += key;
    if (MAIN.currentSquare <= wordLength - 1) MAIN.currentSquare++;
  }
}

async function getNewWord() {
  let valid = false;
  while (!valid) {
    const randomWordUrl = "https://random-word-api.herokuapp.com/word?length=5";
    const res = await fetch(randomWordUrl);
    const data = await res.json();
    const word = await data[0];
    valid = await checkWordValidity(word);

    if (valid) return word;
  }
}

function checkWordValidity(word) {
  // const dictionaryUrl = `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=${dictionaryApiKey}`;
  const freeDictionaryUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;

  return new Promise((res) => {
    fetch(freeDictionaryUrl)
      .then((result) => result.json())
      .then((data) => {
        // data[0]?.meta?.id ? res(true) : res(false);
        data[0]?.word ? res(true) : res(false);
      })
      .catch((err) => console.error(err));
  });
}

function clearRow(row) {
  for (let i = 0; i < wordLength; i++) {
    row[i].textContent = "";
    row[i].classList = "square";
  }
  resetRow();
}

function clearBoard() {
  for (let i = 1; i < 7; i++) {
    const row = MAIN[`row${i}`];
    clearRow(row.children);
  }
  for (const keyStroke of keys) {
    const key = keyStroke.textContent;
    keyStroke.classList = "key";
  }
}

function resetRow(newRow = false) {
  MAIN.currentSquare = 0;
  if (MAIN.currentWordTyped && checkWordValidity(MAIN.currentWordTyped))
    MAIN.wordsAlreadyGuessed.push(MAIN.currentWordTyped);
  MAIN.currentWordTyped = "";
  if (newRow) MAIN.rowToStart++;
}

function validifyRow() {
  const currentRow = MAIN[`row${MAIN.rowToStart}`].children;
  const word = MAIN.wordToGuess.toUpperCase();
  const map = mapLetters();

  for (let i = 0; i < wordLength; i++) {
    const letter = MAIN.currentWordTyped[i];
    if (word[i] === letter) {
      // letter & position match, color square and key green
      currentRow[i].classList.add("green");
      map[letter]--;
      const key = keys.find((key) => key.textContent === letter);
      key.classList.add("green");
    }
  }
  for (let i = 0; i < wordLength; i++) {
    const letter = MAIN.currentWordTyped[i];
    if (map[letter] && map[letter] > 0) {
      // letter match, color square and key yellow
      currentRow[i].classList.add("yellow");
      map[letter]--;
      const key = keys.find((key) => key.textContent === letter);
      key.classList.add("yellow");
    } else {
      // no match, color square and key gray
      currentRow[i].classList.add("gray");
      const key = keys.find((key) => key.textContent === letter);
      key.classList.add("gray");
    }
  }
  checkGameOver();
}

function mapLetters() {
  const word = MAIN.wordToGuess.toUpperCase();
  const map = {};

  for (const char of word) {
    map[char] = map[char]++ || 1;
  }
  return map;
}

function showAlert(text, index, autohide = false) {
  const colors = ["#25ff80", "#f6ff7c", "#ff8a8a"];
  myAlert.style.opacity = 1;
  myAlert.textContent = text;
  myAlert.style.backgroundColor = colors[index];
  if (autohide) setTimer(() => (myAlert.style.opacity = 0), 3000);
}

function checkGameOver() {
  const currentRow = MAIN[`row${MAIN.rowToStart}`].children;
  const row = [...currentRow];
  resetRow(true);
  const noMoreRows = MAIN.rowToStart === 7;
  const allGreens = row.every((square) => square.classList.contains("green"));

  if (noMoreRows) MAIN.keepWinning = false;

  if (allGreens) {
    MAIN.keepWinning = true;
    MAIN.streak++;
    streak.textContent = MAIN.streak;
  }

  if (allGreens || noMoreRows) {
    MAIN.gameOver = true;
    setTimer(() => {
      showAlert(
        `You ${
          allGreens ? "won!" : "lose"
        }! The word was ${MAIN.wordToGuess.toUpperCase()}.`,
        0
      );
      playBtn.style.display = "block";
    }, 10);
  }
}

function setTimer(cb, time) {
  if (timerId) clearTimeout(timerId);
  timerId = setTimeout(cb, time);
}

keys.forEach((key) => {
  if (MAIN.gameOver) return;
  key.addEventListener("click", (e) => {
    const char = e.target.textContent;
    checkSquare(char);
  });
});

window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  const keyCode = key.charCodeAt(0);

  // start new game: Shift + N
  if (e.shiftKey && key === "n") {
    MAIN.keepWinning = false;
    startGame();
  }

  if (MAIN.gameOver) {
    // press enter to play again when game ends
    if (playBtn.style.display === "block" && key === "enter") {
      startGame();
    }
    return;
  }
  const { altKey, ctrlKey, metaKey, shiftKey } = e;
  if (altKey || ctrlKey || metaKey || shiftKey) return;
  if (key === "backspace") {
    checkSquare("⬅︎");
  } else if (key === "enter") {
    checkSquare("Submit");
  } else if (keyCode >= 97 && keyCode <= 122) {
    checkSquare(key.toUpperCase());
  }
});

playBtn.addEventListener("click", startGame);
submitBtn.addEventListener("click", (e) => {
  const char = e.target.textContent;
  checkSquare(char);
});

startGame();
