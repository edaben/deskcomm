/**
 * Os fusos horários que a tela oferece — e a checagem de que o fuso EXISTE.
 *
 * ─── O defeito, medido ─────────────────────────────────────────────────────
 *
 * O campo do fuso da janela de envio era texto livre, validado só por
 * `z.string().min(1).max(64)`. Qualquer coisa passava. E o motor usa
 * `Intl.DateTimeFormat({ timeZone })`, que LANÇA `RangeError` num fuso que não
 * existe:
 *
 *   America/Asuncion   → 23h        ✓
 *   America/Asunción   → RangeError  ← o acento que um hispanofalante escreve
 *   Asuncion           → RangeError
 *
 * Ou seja: um acento no campo salvava sem reclamar e derrubava a avaliação da
 * janela em TODO envio daquele canal. O defeito não aparece na tela que o
 * causou — aparece no worker, horas depois, como envio que não sai.
 *
 * ─── Duas defesas, e as duas fazem falta ───────────────────────────────────
 *
 * A LISTA impede o erro de digitação, que é a origem real. A CHECAGEM defende a
 * API, que aceita qualquer cliente e não passa pela tela — e defende a lista de
 * si mesma, se alguém acrescentar um código errado aqui.
 */

import { FUSOS_HORARIOS } from "@/lib/tempo/opcoes";

const ROTULOS_CONHECIDOS: Record<string, string> = {
  "America/Asuncion": "Assunção (Paraguai)",
  "America/Argentina/Buenos_Aires": "Buenos Aires (Argentina)",
  "America/Montevideo": "Montevidéu (Uruguai)",
  "America/Santiago": "Santiago (Chile)",
  "America/La_Paz": "La Paz (Bolívia)",
  "America/Lima": "Lima (Peru)",
  "America/Bogota": "Bogotá (Colômbia)",
  "America/Guayaquil": "Quito e Guayaquil (Equador)",
  "America/Mexico_City": "Cidade do México (México)",
  "America/New_York": "Nova York (EUA)",
  "America/Los_Angeles": "Los Angeles (EUA)",
  "Europe/London": "Londres (Reino Unido)",
  "Europe/Madrid": "Madri (Espanha)",
  "Europe/Paris": "Paris (França)",
  "Europe/Berlin": "Berlim (Alemanha)",
  "America/Sao_Paulo": "São Paulo (Brasil)",
  "America/Manaus": "Manaus (Brasil)",
  "America/Belem": "Belém (Brasil)",
  "America/Recife": "Recife (Brasil)",
  "America/Fortaleza": "Fortaleza (Brasil)",
  UTC: "UTC",
};

export const FUSOS_OFERECIDOS = FUSOS_HORARIOS.map((codigo) => ({
  codigo,
  rotulo: ROTULOS_CONHECIDOS[codigo] ?? codigo.replaceAll("_", " "),
}));

/**
 * O fuso de quem ainda não escolheu — e o mesmo valor das outras duas pontas:
 * o DEFAULT da coluna `organizations.timezone` (baseline.sql) e o
 * `availabilityScheduleSchema` da jornada (`lib/schemas/routing.ts`).
 *
 * Existe para quem precisa DEGRADAR: leitor que encontra a coluna com um valor
 * que o `Intl` recusa não pode lançar nem inventar UTC — UTC daria três horas
 * de erro numa instalação brasileira, calado. Cair no mesmo valor que o banco
 * já usa como padrão mantém uma verdade só.
 *
 * ⚠️ NÃO é o fuso do pacing. `PACING_DEFAULTS.timezone` tem o mesmo texto e
 * responde a outra pergunta (a janela anti-ban daquele CANAL, override por
 * linha em `channel_knobs`). Coincidem hoje; unificar os dois faria uma
 * decisão de anti-ban mudar o relógio do agente.
 */
export const FUSO_PADRAO = "America/Sao_Paulo";

/**
 * O runtime consegue usar este fuso?
 *
 * Pergunta ao `Intl`, e não a uma lista: é o `Intl` que o motor da janela usa, e
 * uma lista nossa responderia "sim" para um código que ele recusa. A base de
 * fusos muda (países criam e apagam zonas), e quem sabe qual versão está
 * instalada é o próprio runtime.
 */
export function fusoValido(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz }).format(new Date());
    return true;
  } catch {
    return false;
  }
}
