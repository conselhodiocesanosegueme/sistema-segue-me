/** Official workbook: titles on row 1, column labels on row 3, records from row 4. */
export const SHEET_HEADERS = {
  Resumo: ['Indicador', 'Total', '', 'Indicador', 'Total', '', 'Fonte', 'Situação'],
  Encontros: ['ID do encontro', 'Edição', 'Ano', 'Paróquia', 'Cidade/UF', 'Nome do evento', 'Data', 'Documento de origem', 'Status da extração', 'Observação'],
  Pessoas: ['ID da pessoa', 'Nome completo', 'Telefone principal', 'E-mail principal', 'Nascimento', 'Sexo', 'Primeiro encontro localizado', 'Último encontro localizado', 'Situação da identificação', 'Observação'],
  Participações: ['ID da pessoa', 'Nome completo', 'ID do encontro', 'Participação', 'Condição na época', 'Equipe/Órgão', 'Círculo', 'Cargo/Função', 'Padroeiro', 'Página PDF', 'Observação'],
  Mandatos: ['ID da pessoa', 'Nome completo', 'ID do encontro', 'Órgão/Equipe', 'Cargo', 'Condição', 'Ano inicial', 'Ano final', 'Tipo de registro', 'Observação'],
  Casais: ['ID do casal', 'ID pessoa 1', 'Nome pessoa 1', 'ID pessoa 2', 'Nome pessoa 2', 'Início conhecido', 'Fim conhecido', 'Observação'],
  Vivenciaram: ['Nome completo', 'Telefone', 'E-mail', 'Nascimento', 'Sexo', 'Jovem/Casal', 'Situação', 'Cor do círculo', 'Padroeiro', 'Padrinhos (casal)', 'Padrinhos (jovens)', 'Filiação', 'Página PDF', 'Observação', 'ID do encontro', 'Edição', 'Ano', 'Paróquia do encontro', 'Cidade/UF'],
  Trabalharam: ['Nome completo', 'Telefone', 'E-mail', 'Nascimento', 'Instagram', 'Jovem/Casal', 'Vivenciou/Trabalhou', 'Equipe', 'Cargo', 'Membro/Coordenação', 'Página PDF', 'Observação', 'ID do encontro', 'Edição', 'Ano', 'Paróquia do encontro', 'Cidade/UF'],
  'Equipe da Sala': ['Nome completo', 'Telefone', 'E-mail', 'Nascimento', 'Jovem/Casal', 'Cargo na sala', 'Membro/Coordenação', 'Instagram', 'Página PDF', 'Observação', 'ID do encontro', 'Edição', 'Ano', 'Paróquia do encontro', 'Cidade/UF'],
  'Equipe Dirigente': ['Nível', 'Nome completo', 'Função/Área', 'Jovem/Casal', 'Telefone', 'E-mail', 'Relação hierárquica', 'Página PDF', 'Observação', 'ID do encontro', 'Edição', 'Ano', 'Paróquia do encontro', 'Cidade/UF'],
  'Conselho Atual': ['Nível/Setor', 'Cargo', 'Nome', 'Telefone', 'E-mail geral', 'Paróquia', 'Cidade', 'Relação com a paróquia/equipe local', 'ID do encontro', 'Edição', 'Ano', 'Paróquia do encontro', 'Cidade/UF'],
  Palestrantes: ['Palestra', 'Palestrante(s)', 'Telefone', 'Local/Endereço', 'E-mail', 'Página PDF', 'Observação', 'ID do encontro', 'Edição', 'Ano', 'Paróquia do encontro', 'Cidade/UF'],
  'Círculos e Padroeiros': ['Cor do círculo', 'Padroeiro', 'Padrinhos (casal)', 'Padrinhos (jovens)', 'Total de jovens', 'Identificação visual', 'ID do encontro', 'Edição', 'Ano', 'Paróquia do encontro', 'Cidade/UF'],
  Coordenações: ['ID do encontro', 'Ano', 'Edição', 'Paróquia', 'Equipe', 'Coordenador(a) casal 1', 'Coordenador(a) casal 2', 'Coordenador(a) jovem 1', 'Coordenador(a) jovem 2', 'Situação', 'Observação'],
} as const;
export type SheetName = keyof typeof SHEET_HEADERS;
export const SHEET_NAMES = Object.keys(SHEET_HEADERS) as SheetName[];
export const SOURCE_ID = '1-Re_rW5KaumlGlDhp2CT_N6aaweTOZtBYk2a2NTujSo';
export const HEADER_ROW = 3;
export const CHUNK_SIZE = 2000;
