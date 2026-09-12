export const number = (value: number) => new Intl.NumberFormat('pt-BR').format(value);

export const date = (value?: string | null, short = false) => {
  if (!value) return 'Ainda não registrado';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: short ? 'short' : 'long',
        year: 'numeric',
        timeZone: 'America/Sao_Paulo',
      }).format(parsed);
};

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .filter((_, index, parts) => index === 0 || index === parts.length - 1)
    .map((part) => part[0])
    .join('')
    .slice(0, 2);

export const fieldName: Record<string, string> = {
  name: 'Nome completo',
  phone: 'Telefone',
  email: 'E-mail',
  birth_date_text: 'Nascimento',
  sex: 'Sexo',
  identification_status: 'Identificação',
  notes: 'Observações',
  parish: 'Paróquia',
  city: 'Cidade',
  team: 'Equipe',
  kind: 'Participação',
  role: 'Função',
  condition: 'Condição',
  legacy_id: 'Código na base',
  person_id: 'Identificador da pessoa',
  name_requested: 'Nome informado',
  context: 'Informações para identificação',
  source: 'Fonte',
  sheet_name: 'Aba de origem',
  row_number: 'Linha de origem',
  reason: 'Justificativa',
  current: 'Valor atual',
  incoming: 'Valor encontrado',
  field: 'Campo',
  source_name: 'Documento',
  edition: 'Edição',
  year: 'Ano',
  date_text: 'Data',
  title: 'Título',
  start_date: 'Início',
  end_date: 'Término',
  status: 'Situação',
};

export const readable = (value: unknown): string =>
  value === null || value === undefined || value === ''
    ? 'Não informado'
    : Array.isArray(value)
    ? value.map(readable).join(', ')
    : typeof value === 'object'
    ? Object.entries(value as Record<string, unknown>)
        .map(([key, item]) => `${fieldName[key] ?? key}: ${readable(item)}`)
        .join(' · ')
    : String(value);
