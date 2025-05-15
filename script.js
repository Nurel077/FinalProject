class Minesweeper {
    constructor() {
        this.boardSize = 10;
        this.board = [];
        this.gameOver = false;
        this.firstClick = true;
        this.flagsPlaced = 0;
        this.time = 0;
        this.timer = null;

        this.difficulty = 'medium';
        this.difficultySettings = {
            easy: 3,
            medium: 10,
            hard: 25
        };

        this.difficults();
        this.game_initialization();
        this.setupEventListeners();
        this.loadLeaderboard();
    }

    difficults() {
        const select = document.getElementById('difficulty');
        this.minesCount = this.difficultySettings[select.value];
        this.difficulty = select.value;

        select.addEventListener('change', () => {
            this.difficulty = select.value;
            this.minesCount = this.difficultySettings[this.difficulty];
            this.reload_game();
        });
    }

    game_initialization() {
        this.createBoard();
        this.update_mines_count();
    }

    createBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';
        this.board = [];

        for (let i = 0; i < this.boardSize; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.boardSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                gameBoard.appendChild(cell);
                this.board[i][j] = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborMines: 0
                };
            }
        }
    }

    mines(firstClickRow, firstClickCol) {
        let minesPlaced = 0;
        while (minesPlaced < this.minesCount) {
            const row = Math.floor(Math.random() * this.boardSize);
            const col = Math.floor(Math.random() * this.boardSize);

            if (Math.abs(row - firstClickRow) <= 1 && Math.abs(col - firstClickCol) <= 1) {
                continue;
            }

            if (!this.board[row][col].isMine) {
                this.board[row][col].isMine = true;
                minesPlaced++;
            }
        }
        this.calc_near_mines();
    }

    calc_near_mines() {
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (!this.board[i][j].isMine) {
                    let count = 0;
                    for (let di = -1; di <= 1; di++) {
                        for (let dj = -1; dj <= 1; dj++) {
                            const newRow = i + di;
                            const newCol = j + dj;
                            if (newRow >= 0 && newRow < this.boardSize && 
                                newCol >= 0 && newCol < this.boardSize && 
                                this.board[newRow][newCol].isMine) {
                                count++;
                            }
                        }
                    }
                    this.board[i][j].neighborMines = count;
                }
            }
        }
    }

    setupEventListeners() {
        const gameBoard = document.getElementById('game-board');
        const resetButton = document.getElementById('reset-button');

        gameBoard.addEventListener('click', (e) => {
            if (e.target.classList.contains('cell') && !this.gameOver) {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                this.open_click(row, col);
            }
        });

        gameBoard.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (e.target.classList.contains('cell') && !this.gameOver) {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                this.flag_click(row, col);
            }
        });

        resetButton.addEventListener('click', () => {
            this.reload_game();
        });
    }

    open_click(row, col) {
        if (this.firstClick) {
            this.mines(row, col);
            this.firstClick = false;
            this.start_timer();
        }

        if (this.board[row][col].isFlagged || this.board[row][col].isRevealed) {
            return;
        }

        if (this.board[row][col].isMine) {
            this.gameOver = true;
            this.open_all_mines();
            return;
        }

        this.open_cell(row, col);
        this.check_win();
    }

    flag_click(row, col) {
        if (this.board[row][col].isRevealed) {
            return;
        }

        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        
        if (this.board[row][col].isFlagged) {
            this.board[row][col].isFlagged = false;
            cell.classList.remove('flagged');
            cell.textContent = '';
            this.flagsPlaced--;
        } else if (this.flagsPlaced < this.minesCount) {
            this.board[row][col].isFlagged = true;
            cell.classList.add('flagged');
            cell.textContent = '🚩';
            this.flagsPlaced++;
        }

        this.update_mines_count();
    }

    open_cell(row, col) {
        if (row < 0 || row >= this.boardSize || col < 0 || col >= this.boardSize || 
            this.board[row][col].isRevealed || this.board[row][col].isFlagged) {
            return;
        }

        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        this.board[row][col].isRevealed = true;
        cell.classList.add('revealed');

        if (this.board[row][col].neighborMines > 0) {
            cell.textContent = this.board[row][col].neighborMines;
            cell.setAttribute('data-number', this.board[row][col].neighborMines);
        } else {
            for (let di = -1; di <= 1; di++) {
                for (let dj = -1; dj <= 1; dj++) {
                    this.open_cell(row + di, col + dj);
                }
            }
        }
    }

    open_all_mines() {
        const animationPromises = [];

        const createAnimationPromise = (element, animationClass) => {
            return new Promise((resolve) => {
                const handleAnimationEnd = () => {
                    element.removeEventListener('animationend', handleAnimationEnd);
                    resolve();
                };
                element.addEventListener('animationend', handleAnimationEnd);
                element.classList.add(animationClass);
            });
        };

        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j].isMine) {
                    const cell = document.querySelector(`[data-row="${i}"][data-col="${j}"]`);
                    cell.classList.add('mine');
                    cell.textContent = '💣';
                    animationPromises.push(createAnimationPromise(cell, 'mine'));

                    for (let di = -1; di <= 1; di++) {
                        for (let dj = -1; dj <= 1; dj++) {
                            const newRow = i + di;
                            const newCol = j + dj;
                            if (newRow >= 0 && newRow < this.boardSize && 
                                newCol >= 0 && newCol < this.boardSize &&
                                !this.board[newRow][newCol].isMine) {
                                const neighborCell = document.querySelector(`[data-row="${newRow}"][data-col="${newCol}"]`);
                                animationPromises.push(
                                    createAnimationPromise(neighborCell, 'explosion-wave')
                                        .then(() => createAnimationPromise(neighborCell, 'destroyed'))
                                );
                            }
                        }
                    }
                }
            }
        }

        Promise.all(animationPromises).then(() => {
            this.stop_timer();
            setTimeout(() => {
                alert('Game Over!');
            }, 500);
        });
    }

    check_win() {
        let closed_cells = 0;
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (!this.board[i][j].isRevealed && !this.board[i][j].isMine) {
                    closed_cells++;
                }
            }
        }

        if (closed_cells === 0) {
            this.gameOver = true;
            this.stop_timer();
            alert('Congratulations! You won!')
            this.lead_board(this.time);
            alert('Congratulations! You won!');
        }
    }

    update_mines_count() {
        document.getElementById('mines-left').textContent = this.minesCount - this.flagsPlaced;
    }

    start_timer() {
        this.timer = setInterval(() => {
            this.time++;
            document.getElementById('time').textContent = this.time;
        }, 1000);
    }

    stop_timer() {
        clearInterval(this.timer);
    }

    reload_game() {
        this.gameOver = false;
        this.firstClick = true;
        this.flagsPlaced = 0;
        this.time = 0;
        document.getElementById('time').textContent = '0';
        this.stop_timer();
        this.game_initialization();
        this.update_lead__board();
    }

    lead_board(time) {
        const leaderboardKey = `minesweeper-leaderboard-${this.difficulty}`;
        const record = { time, date: new Date().toLocaleString() };

        const records = JSON.parse(localStorage.getItem(leaderboardKey)) || [];
        records.push(record);
        records.sort((a, b) => a.time - b.time);
        const topRecords = records.slice(0, 5);
        localStorage.setItem(leaderboardKey, JSON.stringify(topRecords));
        this.update_lead__board();
    }

    loadLeaderboard() {
        this.update_lead__board();
    }

    update_lead__board() {
        const list = document.getElementById('leaderboard-list');
        const leaderboardKey = `minesweeper-leaderboard-${this.difficulty}`;
        const records = JSON.parse(localStorage.getItem(leaderboardKey)) || [];

        list.innerHTML = '';
        records.forEach((r, i) => {
            const li = document.createElement('li');
            li.textContent = `#${i + 1}: ${r.time} сек - ${r.date}`;
            list.appendChild(li);
        });
    }
}

window.addEventListener('load', () => {
    new Minesweeper();
});
