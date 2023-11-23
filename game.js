const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameInfo = document.getElementById('gameInfo');
const replayButton = document.getElementById('replayButton');

const redChecker = new Image();
const redCheckerK = new Image();
const blaChecker = new Image();
const blaCheckerK = new Image();

redChecker.src = 'redChecker.png';
redCheckerK.src = 'redCheckerK.png';
blaChecker.src = 'blaChecker.png';
blaCheckerK.src = 'blaCheckerK.png';

const boardSize = 8;
const imageSize = 70;
const squareSize = canvas.width / boardSize;

let playerGo = true;
let aiGo = false;

const board = [
    [null, blaChecker, null, blaChecker, null, blaChecker, null, blaChecker],
    [blaChecker, null, blaChecker, null, blaChecker, null, blaChecker, null],
    [null, blaChecker, null, blaChecker, null, blaChecker, null, blaChecker],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [redChecker, null, redChecker, null, redChecker, null, redChecker, null],
    [null, redChecker, null, redChecker, null, redChecker, null, redChecker],
    [redChecker, null, redChecker, null, redChecker, null, redChecker, null],
];

let selectedPiece = null;
let validMoves = [];
let isDragging = false;
let dragOffsetX, dragOffsetY;
let gameOver = false;

function drawBoard() {
            for (let row = 0; row < boardSize; row++) {
                for (let col = 0; col < boardSize; col++) {
                    const x = col * imageSize;
                    const y = row * imageSize;

                    ctx.fillStyle = (row + col) % 2 === 0 ? '#fff' : '#000';
                    ctx.fillRect(x, y, imageSize, imageSize);
                }
            }
}

function drawPieces() {
            for (let row = 0; row < boardSize; row++) {
                for (let col = 0; col < boardSize; col++) {
                    const piece = board[row][col];
                    if (piece !== null) {
                        const x = col * imageSize;
                        const y = row * imageSize;
                        const pieceImage = getImageForPiece(piece);
                        ctx.drawImage(pieceImage, x, y, imageSize, imageSize);
                    }
                }
            }
}

function getInitialPiece(row, col) {
            if ((row + col) % 2 !== 0) {
                if (row < 3) return blaChecker;
                else if (row > 4) return redChecker;
            }
            return null;
}

function getImageForPiece(piece) {
            if (piece === redChecker) return redChecker;
            else if (piece === redCheckerK) return redCheckerK;
            else if (piece === blaChecker) return blaChecker;
            else if (piece === blaCheckerK) return blaCheckerK;
            else return redChecker;
}

function highlightValidMoves() {
            validMoves.forEach(move => {
                const [row, col] = move;
                const x = col * imageSize;
                const y = row * imageSize;

                ctx.strokeStyle = '#00f';
                ctx.lineWidth = 5;
                ctx.strokeRect(x, y, imageSize, imageSize);
            });
}

function checkForAvailableMoves() {
    const pieces = playerGo ? getAllPlayerPieces() : getAllAIPieces();

    for (const piece of pieces) {
        const moves = getValidMoves(piece.row, piece.col);
        const jumpMoves = getJumpMoves(piece.row, piece.col);

        if (moves.length > 0 || jumpMoves.length > 0) {
            return true; // At least one available move
        }
    }

    return false; // No available moves
}

function getAllPlayerPieces() {
    const playerPieces = [];
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            const piece = board[row][col];
            if (piece === redChecker || piece === redCheckerK) {
                playerPieces.push({ row, col });
            }
        }
    }
    return playerPieces;
}

function getAllAIPieces() {
    const aiPieces = [];
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            const piece = board[row][col];
            if (piece === blaChecker || piece === blaCheckerK) {
                aiPieces.push({ row, col });
            }
        }
    }
    return aiPieces;
}

function movePiece(startRow, startCol, targetRow, targetCol) {
            const pieceToMove = board[startRow][startCol];

            if (validMoves.some(move => move[0] === targetRow && move[1] === targetCol)) {
                board[targetRow][targetCol] = pieceToMove;
                board[startRow][startCol] = null;

                if ((pieceToMove === redChecker && targetRow === 0) || (pieceToMove === blaChecker && targetRow === boardSize - 1)) {
                    board[targetRow][targetCol] = pieceToMove === redChecker ? redCheckerK : blaCheckerK;
                }

                if (Math.abs(targetRow - startRow) === 2) {
                    const jumpedRow = (targetRow + startRow) / 2;
                    const jumpedCol = (targetCol + startCol) / 2;
                    board[jumpedRow][jumpedCol] = null;
                }

                selectedPiece = null;
                validMoves = [];
                playerGo = true;
                aiGo = false;
                mainGameLoop();
            } else {
                selectedPiece = null;
                validMoves = [];
                drawBoard();
                drawPieces();
            }
}

function checkForWin() {
            const playerPieces = board.flat().filter(piece => piece === redChecker || piece === redCheckerK);
            const aiPieces = board.flat().filter(piece => piece === blaChecker || piece === blaCheckerK);

            if (playerPieces.length === 0) {
                endGame('You Lose');
            } else if (aiPieces.length === 0) {
                endGame('You Win');
            }
}

function resetGame() {
            selectedPiece = null;
            validMoves = [];
            playerGo = true;
            aiGo = false;
            gameOver = false;

            board.forEach((row, rowIndex) => {
                row.forEach((_, colIndex) => {
                    board[rowIndex][colIndex] = getInitialPiece(rowIndex, colIndex);
                });
            });

            drawBoard();
            drawPieces();
            gameInfo.textContent = 'Player\'s Turn';
            replayButton.style.display = 'none';
}

function endGame(message) {
            gameInfo.textContent = message;
            replayButton.style.display = 'block';
            gameOver = true;
}

function aiTurn() {
    if (!gameOver) {
        // Find all AI pieces
        const aiPieces = [];
        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                const piece = board[row][col];
                if (piece === blaChecker || piece === blaCheckerK) {
                    aiPieces.push({ row, col });
                }
            }
        }

        // Try to make a random move with a random piece
        const makeRandomMove = () => {
            const randomIndex = Math.floor(Math.random() * aiPieces.length);
            const selectedPiece = aiPieces[randomIndex];
            const moves = getValidMoves(selectedPiece.row, selectedPiece.col);

            const jumpMoves = getJumpMoves(selectedPiece.row, selectedPiece.col);
            if (jumpMoves.length > 0) {
                // Prioritize jump moves if available
                const randomJump = jumpMoves[Math.floor(Math.random() * jumpMoves.length)];
                const [targetRow, targetCol] = randomJump;

                // Move the AI piece to the target position
                board[targetRow][targetCol] = board[selectedPiece.row][selectedPiece.col];
                board[selectedPiece.row][selectedPiece.col] = null;

                // Check if the piece has reached the opposite side to become a king
                const movedPiece = board[targetRow][targetCol];
                if ((movedPiece === blaChecker && targetRow === boardSize - 1)) {
                    board[targetRow][targetCol] = blaCheckerK;
                }

                // Remove the player's piece that was jumped
                const jumpedRow = (selectedPiece.row + targetRow) / 2;
                const jumpedCol = (selectedPiece.col + targetCol) / 2;
                board[jumpedRow][jumpedCol] = null;

                drawBoard();
                drawPieces();
                checkForWin();
            } else if (moves.length > 0) {
                // Make a regular move if no jump moves are available
                const randomMove = moves[Math.floor(Math.random() * moves.length)];
                const [targetRow, targetCol] = randomMove;

                // Move the AI piece to the target position
                board[targetRow][targetCol] = board[selectedPiece.row][selectedPiece.col];
                board[selectedPiece.row][selectedPiece.col] = null;

                // Check if the piece has reached the opposite side to become a king
                const movedPiece = board[targetRow][targetCol];
                if ((movedPiece === blaChecker && targetRow === boardSize - 1)) {
                    board[targetRow][targetCol] = blaCheckerK;
                }

                drawBoard();
                drawPieces();
                checkForWin();
             } else {
                // Remove the piece from consideration if it has no valid moves
                aiPieces.splice(randomIndex, 1);
                makeRandomMove(); // Try another move
            }
        };

        makeRandomMove(); // Start the AI move
    }
}



function evaluateMove(startRow, startCol, targetRow, targetCol) {
    const baseScore = 1;

    // Bonus score for reaching the opposite end and getting kinged
    const kingBonus = (targetRow === 0 && board[startRow][startCol] === blaChecker) ||
                      (targetRow === boardSize - 1 && board[startRow][startCol] === blaCheckerK) ? 2 : 0;

    // Evaluate the move based on the target position and king bonus
    return baseScore + kingBonus;
}

function isKing(row, col) {
    const piece = board[row][col];
    return piece === redCheckerK || piece === blaCheckerK;
}

function getValidMoves(row, col) {
    const moves = [];
    const forwardRow = playerGo ? row - 1 : row + 1;
    const backwardRow = playerGo ? row + 1 : row - 1;

    if (isValidMove(forwardRow, col - 1)) {
        moves.push([forwardRow, col - 1]);
    }

    if (isValidMove(forwardRow, col + 1)) {
        moves.push([forwardRow, col + 1]);
    }

    if (isKing(row, col)) {
        // Allow backward moves only for Kings
        if (isValidMove(backwardRow, col - 1)) {
            moves.push([backwardRow, col - 1]);
        }

        if (isValidMove(backwardRow, col + 1)) {
            moves.push([backwardRow, col + 1]);
        }
    }

    const jumpMoves = getJumpMoves(row, col);
    moves.push(...jumpMoves);

    return moves;
}

function getJumpMoves(row, col) {
    const jumps = [];
    const forwardRow = playerGo ? row - 2 : row + 2;
    const backwardRow = playerGo ? row + 2 : row - 2;

    if (isValidMove(forwardRow, col - 2) && isOpponentPiece(row - 1, col - 1)) {
        jumps.push([forwardRow, col - 2]);
    }

    if (isValidMove(forwardRow, col + 2) && isOpponentPiece(row - 1, col + 1)) {
        jumps.push([forwardRow, col + 2]);
    }

    if (isKing(row, col)) {
        // Allow backward jumps only for Kings
        if (isValidMove(backwardRow, col - 2) && isOpponentPiece(row + 1, col - 1)) {
            jumps.push([backwardRow, col - 2]);
        }

        if (isValidMove(backwardRow, col + 2) && isOpponentPiece(row + 1, col + 1)) {
            jumps.push([backwardRow, col + 2]);
        }
    }

    return jumps;
}

function isValidMove(row, col) {
            if (row >= 0 && row < boardSize && col >= 0 && col < boardSize) {
                return board[row][col] === null;
            }
            return false;
}

function isOpponentPiece(row, col) {
            if (row >= 0 && row < boardSize && col >= 0 && col < boardSize) {
                const piece = board[row][col];
                return (playerGo && (piece === blaChecker || piece === blaCheckerK)) ||
                    (!playerGo && (piece === redChecker || piece === redCheckerK));
            }
            return false;
}

function handleMouseMove(event) {
           if (isDragging) {
                const rect = canvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawBoard();

                for (let row = 0; row < boardSize; row++) {
                    for (let col = 0; col < boardSize; col++) {
                        if (!(row === selectedPiece.row && col === selectedPiece.col)) {
                            const piece = board[row][col];
                            if (piece !== null) {
                                const pieceImage = getImageForPiece(piece);
                                const pieceX = col * imageSize;
                                const pieceY = row * imageSize;
                                ctx.drawImage(pieceImage, pieceX, pieceY, imageSize, imageSize);
                            }
                        }
                    }
                }

                const pieceImage = getImageForPiece(board[selectedPiece.row][selectedPiece.col]);
                const pieceX = x - imageSize / 2;
                const pieceY = y - imageSize / 2;
                ctx.drawImage(pieceImage, pieceX, pieceY, imageSize, imageSize);

                highlightValidMoves();
            }
}

function handleMouseUp(event) {
            if (isDragging) {
                const rect = canvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                const col = Math.floor(x / imageSize);
                const row = Math.floor(y / imageSize);

                isDragging = false;

                if (validMoves.some(move => move[0] === row && move[1] === col)) {
                    movePiece(selectedPiece.row, selectedPiece.col, row, col);
                    checkForWin();

                    playerGo = false;
                    aiGo = true;
                    mainGameLoop();
                } else {
                    selectedPiece = null;
                    validMoves = [];
                    drawBoard();
                    drawPieces();
                }
            }
}

function handleMouseDown(event) {
            if (playerGo && !gameOver) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const col = Math.floor(x / imageSize);
    const row = Math.floor(y / imageSize);


                if (row >= 0 && row < boardSize && col >= 0 && col < boardSize) {
                    const piece = board[row][col];
                    if (piece === redChecker || piece === redCheckerK) {
                        selectedPiece = { row, col };
                        isDragging = true;
                        dragOffsetX = x - col * imageSize;
                        dragOffsetY = y - row * imageSize;
                        validMoves = getValidMoves(row, col);
                        highlightValidMoves();
                    }
                }
            }
}

// ...

function handleTouchStart(event) {
    event.preventDefault(); // Prevent default touch behavior

    if (playerGo && !gameOver) {
        const touch = event.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        handleMouseDown({ clientX: x, clientY: y });
    }
}

function handleTouchMove(event) {
    event.preventDefault(); // Prevent default touch behavior

    if (isDragging) {
        const touch = event.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        handleMouseMove({ clientX: x, clientY: y });
    }
}

function handleTouchEnd(event) {
    event.preventDefault(); // Prevent default touch behavior

    if (isDragging) {
        const touch = event.changedTouches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        handleMouseUp({ clientX: x, clientY: y });
    }
}

// ...

function mainGameLoop() {
    drawBoard();
    drawPieces();

    if (playerGo && !gameOver) {
        const movesAvailable = checkForAvailableMoves();
        if (!movesAvailable) {
            endTurnWithNoMoves();
        } else {
            canvas.addEventListener('mousedown', handleMouseDown);
            canvas.addEventListener('mousemove', handleMouseMove);
            canvas.addEventListener('mouseup', handleMouseUp);

            // Add touch events for mobile
            canvas.addEventListener('touchstart', handleTouchStart);
            canvas.addEventListener('touchmove', handleTouchMove);
            canvas.addEventListener('touchend', handleTouchEnd);
        }
    } else if (aiGo && !gameOver) {
        const movesAvailable = checkForAvailableMoves();
        if (!movesAvailable) {
            endTurnWithNoMoves();
        } else {
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseup', handleMouseUp);

            // Remove touch events for mobile
            canvas.removeEventListener('touchstart', handleTouchStart);
            canvas.removeEventListener('touchmove', handleTouchMove);
            canvas.removeEventListener('touchend', handleTouchEnd);

            aiTurn();
            playerGo = true;
            aiGo = false;
            gameInfo.textContent = 'Player\'s Turn';
            setTimeout(mainGameLoop, 500); // Delay AI turn for better visibility
        }
    }
}

// ...


function endTurnWithNoMoves() {
    gameInfo.textContent = 'No Moves Available!';
    playerGo = !playerGo; // Switch to the next player
    setTimeout(mainGameLoop, 1000); // Delay for better visibility of the message
}


document.addEventListener("DOMContentLoaded", function () {
    resetGame();
    mainGameLoop();
    replayButton.style.display = 'none';
});
