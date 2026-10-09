export class BufferCompression {
  public static deltaEncode(numbers: number[]): number[] {
    if (numbers.length === 0) return [];
    const deltas: number[] = [numbers[0]];
    for (let i = 1; i < numbers.length; i++) {
      deltas.push(numbers[i] - numbers[i - 1]);
    }
    return deltas;
  }

  public static deltaDecode(deltas: number[]): number[] {
    if (deltas.length === 0) return [];
    const numbers: number[] = [deltas[0]];
    for (let i = 1; i < deltas.length; i++) {
      numbers.push(numbers[i - 1] + deltas[i]);
    }
    return numbers;
  }
}
