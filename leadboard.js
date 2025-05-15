   const difficulties = ['easy', 'medium', 'hard'];

    function loadLeaderboard() {
      const container = document.getElementById('leaderboard-container');
      difficulties.forEach(diff => {
        const key = `minesweeper-leaderboard-${diff}`;
        const records = JSON.parse(localStorage.getItem(key)) || [];

        const section = document.createElement('div');
        section.classList.add('difficulty-section');

        const title = document.createElement('h2');
        title.textContent = `Уровень: ${diff.charAt(0).toUpperCase() + diff.slice(1)}`;
        section.appendChild(title);

        if (records.length === 0) {
          const empty = document.createElement('p');
          empty.textContent = 'Нет рекордов';
          section.appendChild(empty);
        } else {
          const ul = document.createElement('ul');
          records.forEach((record, index) => {
            const li = document.createElement('li');
            li.textContent = `#${index + 1}: ${record.time} сек – ${record.date}`;
            ul.appendChild(li);
          });
          section.appendChild(ul);
        }

        container.appendChild(section);
      });
    }

    window.onload = loadLeaderboard;