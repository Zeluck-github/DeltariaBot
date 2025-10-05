type PLURALParam = string | number | boolean | null | undefined

export function plural(sing: PLURALParam, plur: PLURALParam, count: number) {
    return count > 1 ? plur : sing
}