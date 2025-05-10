export function slugify(title) {
  return title
    .toLowerCase()
    .normalize('NFD') // supprime les accents
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-') // remplace les non alphanumériques par des tirets
    .replace(/^-+|-+$/g, ''); // supprime les tirets au début/fin
}
