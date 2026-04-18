export function getRankFromPoints(pts) {
  if (pts >= 900) return 'S'
  if (pts >= 700) return 'A'
  if (pts >= 500) return 'B'
  if (pts >= 300) return 'C'
  if (pts >= 100) return 'D'
  return 'E'
}

export function getCompletionQuip(taskTitle, points) {
  const quips = [
    `Boom! ${points.toLocaleString()} pts. "${taskTitle}" -- DONE. Go grab that reward!`,
    `${points.toLocaleString()} points SECURED. That took guts. Quest Life salutes you.`,
    `BIG WIN: "${taskTitle}" complete. ${points.toLocaleString()} pts dropped into your bank.`,
    `You just defeated the boss. ${points.toLocaleString()} points is your loot.`,
    `That wasn't easy and you did it anyway. ${points.toLocaleString()} pts earned.`,
  ]
  return quips[Math.floor(Math.random() * quips.length)]
}
