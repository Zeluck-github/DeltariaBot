type LBParam = string | number | boolean | null | undefined

export function lb(...strings: LBParam[]) {
    return strings.filter(Boolean).join("\n")
}