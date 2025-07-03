export function wrapRegion(content: string, regionName: string): string {
  if (!content.trim()) return ''
  
  return `#region ${regionName}
${content}
#endregion`
}

export function joinSections(...sections: string[]): string {
  const validSections = sections.filter(section => section && section.trim())
  return validSections.join('\n\n')
}
