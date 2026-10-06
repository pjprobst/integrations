const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
});

const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
});

export function formatEasternDateTime(datetime) {
    const date = dateFormatter.format(datetime).replaceAll('/', '.');
    const time = `${timeFormatter.format(datetime).replaceAll(' ', '').toLowerCase()} ET`;

    return { date, time };
}
