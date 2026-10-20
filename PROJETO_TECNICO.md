# Projeto técnico: Caderno de pistas

**Status:** proposta para discussão  
**Design de referência:** conceito “Caderno de pistas”, aberto por padrão em `index.html`  
**Premissa:** como o PRD ainda não foi preenchido, este documento transforma o protótipo atual em uma proposta implementável. As escolhas marcadas como pendentes precisam de validação antes do lançamento.

## 1. Resumo

Construir um jogo web casual de dedução de palavras. Em cada desafio, a pessoa tenta descobrir uma palavra de cinco letras em até seis tentativas. Depois de cada palpite válido, o tabuleiro informa quais letras estão na resposta e se estão na posição correta. A experiência deve ser rápida, funcionar em celular e desktop, dispensar cadastro e permitir compartilhar um resultado sem revelar a resposta.

O protótipo atual demonstra o tabuleiro, estados de letras, estatísticas, compartilhamento e o fluxo da partida. A palavra `PLUMA`, a lista pequena de palpites e as estatísticas exibidas são dados de demonstração; não representam um catálogo, agenda ou persistência prontos para produção.

## 2. Objetivos e fora de escopo

### Objetivos do MVP

- Iniciar uma partida sem cadastro e sem tutorial obrigatório.
- Permitir até seis palpites de cinco letras por desafio.
- Validar palpites e produzir feedback consistente para letras repetidas.
- Salvar a partida e as estatísticas no mesmo dispositivo.
- Apresentar estados de vitória, derrota, recarga da página e compartilhamento.
- Manter a interface operável por teclado, leitor de tela e toque.

### Fora do MVP

- Contas, sincronização entre dispositivos, placar global e partidas em tempo real.
- Monetização, anúncios e compras dentro do jogo.
- Arquivo de desafios e modos para duas ou mais palavras.
- Geração automática de respostas, IA semântica ou dicionário aberto sem curadoria.

## 3. Premissas e decisões pendentes

| Tema | Proposta inicial | Decisão necessária |
|---|---|---|
| Público/idioma | Português brasileiro, texto em `pt-BR` | Confirmar público no Brasil ou suporte também a outras variantes do português. |
| Plataforma | Aplicação web responsiva; instalação como PWA pode vir depois | Confirmar necessidade de instalação e uso offline no lançamento. |
| Palavra | Cinco letras, seis tentativas | Confirmar tamanho e limite como regras definitivas. |
| Acentos | Comparar palavras sem distinguir marcas diacríticas, mantendo grafia correta no texto | Validar com falantes e decidir como tratar pares em que o acento muda significado. |
| Desafio diário | Um puzzle diário, com identificador estável e horário configurável | Escolher fuso e horário de virada. Não usar o relógio local sem regra explícita. |
| Vocabulário | Lista editorial separada de respostas e palpites permitidos | Definir fonte, licença, flexões, regionalismos, nomes próprios e processo de revisão. |
| Dados | Progresso e estatísticas locais, sem conta | Definir política de retenção e se haverá telemetria. |
| Justiça competitiva | Sem garantia anti-trapaça no MVP | Se placares ou prêmios forem importantes, respostas não podem ser confiadas ao cliente. |

## 4. Experiência e regras

1. A pessoa abre o desafio atual e recebe foco no campo de palpite.
2. Digita uma palavra de cinco letras e envia por botão ou tecla Enter.
3. O sistema verifica formato, dicionário e estado da partida antes de consumir tentativa.
4. Um palpite aceito ocupa a próxima linha do tabuleiro. Cada posição comunica um estado: letra e posição corretas, letra existente em outra posição ou letra ausente.
5. A partida termina quando a palavra é descoberta ou após seis palpites válidos. Palpites inválidos e duplicados não consomem tentativa.
6. A tela anuncia o resultado, atualiza estatísticas e disponibiliza compartilhamento sem spoiler.

Estados visuais não devem depender apenas de cor. Cada estado de letra precisa de nome acessível/descrição para tecnologia assistiva; texto de feedback resume o resultado da ação sem mover o foco.

### Normalização e pontuação

- Normalizar Unicode antes de comparar; converter para caixa alta e normalizar acentos segundo a regra de produto definida acima.
- Considerar letras, não bytes ou unidades UTF-16, ao validar o comprimento. Letras acentuadas contam como uma posição.
- Separar o conjunto de palpites aceitos do conjunto de respostas possíveis. Uma palavra pode ser válida como palpite sem poder ser resposta.
- Calcular primeiro as letras na posição exata; depois atribuir correspondências fora de posição apenas às ocorrências ainda disponíveis na resposta. Isso evita marcar duplicatas em excesso.
- Testar explicitamente respostas e palpites com letras repetidas, como `ERRO` em um jogo futuro de quatro letras, e combinações acentuadas.

## 5. Arquitetura proposta

### Tecnologia

Para o MVP, evoluir a página estática para **TypeScript com Vite**, mantendo a interface sem framework de componentes. O fluxo e o tabuleiro são pequenos; módulos TypeScript mantêm lógica e DOM separados sem adicionar dependências de runtime. Usar HTML semântico e CSS responsivo. O protótipo atual pode servir como referência visual enquanto a lógica é extraída.

Não introduzir backend no primeiro incremento se jogo local, sem conta e sem classificação oficial satisfizerem o PRD. Essa escolha reduz operação e coleta de dados, mas não protege as respostas de quem inspeciona os arquivos públicos.

### Módulos

- `game/normalize.ts`: normalização de Unicode e validação de caracteres/comprimento.
- `game/score.ts`: função pura que calcula o resultado por posição, incluindo duplicatas.
- `game/validate-guess.ts`: validação de formato, palavra permitida, repetição e partida encerrada.
- `game/session.ts`: estado da partida, submissão, vitória/derrota e eventos de domínio.
- `puzzles/catalog.ts`: leitura das respostas e palpites aceitos, separados por versão/idioma.
- `puzzles/daily.ts`: resolução do `puzzleId` para a data no fuso configurado.
- `storage/repository.ts`: leitura, escrita, migração e recuperação de dados locais.
- `stats/aggregate.ts`: atualização idempotente de partidas, vitórias, sequência e distribuição de tentativas.
- `sharing/share-result.ts`: geração e cópia do resumo sem palavra secreta.
- `ui/`: renderização, eventos, mensagens de estado, tabuleiro e navegação por teclado.

Regra de dependência: módulos de domínio não importam DOM, armazenamento nem APIs do navegador. A UI chama o domínio e renderiza o novo estado. Essa separação permite testar as regras sem iniciar o browser.

### Organização sugerida

```text
src/
  main.ts
  game/
  puzzles/
  stats/
  storage/
  sharing/
  ui/
  styles/
data/
  pt-BR/
    allowed-guesses.json
    daily-puzzles.json
tests/
  unit/
  browser/
```

## 6. Dados e persistência

### Catálogo editorial

Manter dois conjuntos versionados: `allowedGuesses` e `dailyPuzzles`. Cada resposta publicada precisa ter identificador imutável, data de lançamento, palavra canônica, forma exibida, versão do catálogo e metadados editoriais internos. Evitar depender de uma API/dicionário externo durante a partida. Um processo editorial deve verificar grafia, frequência, adequação ao público, ambiguidade e validade da palavra antes de publicar.

O cliente deve validar respostas e palpites usando a mesma versão de catálogo que carregou. Se o catálogo falhar, explicar o problema e permitir tentar novamente; não consumir tentativa.

### Armazenamento local

Usar `localStorage` inicialmente, com chave versionada, por exemplo `jogoPalavras:v1`. Persistir:

- identificador do puzzle atual e palpites já aceitos;
- resultado final, número de tentativas e data do último desafio concluído;
- total de partidas, percentual de vitórias, sequência atual/máxima e distribuição de tentativas;
- preferências locais, se incluírem tema ou alto contraste.

Não armazenar nome, e-mail ou conteúdo de texto fora dos palpites do jogo. Uma partida deve ser recuperável após atualizar a página. O cálculo de estatísticas deve ser idempotente: recarregar ou reabrir uma partida concluída não conta a vitória novamente. Dados corrompidos devem ser tratados com segurança, com opção para reiniciar estatísticas.

Se sincronização entre dispositivos for aprovada posteriormente, adicionar autenticação e API; não tentar sincronizar gravações locais anônimas sem definir identidade, conflitos e consentimento.

## 7. Contratos de domínio

Tipos ilustrativos, não vinculados ainda a um backend:

```ts
type LetterMark = "correct" | "present" | "absent";

type GuessResult = {
  guess: string;
  marks: LetterMark[];
};

type GameSession = {
  puzzleId: string;
  guesses: GuessResult[];
  status: "playing" | "won" | "lost";
};

type PlayerStats = {
  played: number;
  wins: number;
  currentStreak: number;
  bestStreak: number;
  guessDistribution: number[];
  lastCompletedPuzzleId?: string;
};
```

Invariantes: `guesses.length <= 6`; apenas palpites aceitos entram na sessão; uma sessão encerrada não aceita novas tentativas; o resultado de cada palpite sempre tem cinco marcas; estatísticas são atualizadas uma vez por `puzzleId`.

## 8. Interface, acessibilidade e responsividade

- Usar landmarks, títulos em ordem lógica, idioma da página declarado e rótulos associados aos campos.
- Todos os controles devem funcionar com teclado e exibir foco visível; a submissão funciona com Enter. O foco permanece previsível após validações e atualizações do tabuleiro.
- Anunciar erro, sucesso e número de tentativas restantes por região de status, sem anunciar a grade inteira após cada renderização.
- Dar nome textual aos estados coloridos. Manter contraste mínimo WCAG 2.2 AA: 4,5:1 para texto normal e 3:1 para elementos gráficos necessários.
- Respeitar `prefers-reduced-motion`; não usar cor como único indicador; garantir zoom a 200% e viewport estreita sem rolagem horizontal da página.
- Alvos de toque devem atender ao critério mínimo WCAG aplicável e, sempre que possível, aproximar-se de 44 × 44 CSS px.
- Ter estados visíveis para carregando, erro de catálogo, palpite inválido, palavra duplicada, vitória, derrota e progresso restaurado.

## 9. Compartilhamento e privacidade

Gerar um resumo determinístico por tentativa (por exemplo, uma linha de cinco símbolos por palpite), sem incluir resposta, campo digitado ou identificador que permita inferi-la. Usar `navigator.share` quando disponível e oferecer cópia para a área de transferência como fallback. Tratar permissões negadas sem bloquear o jogo.

No MVP, não enviar palpites ou estatísticas a terceiros. Caso analytics seja aprovado, coletar apenas eventos mínimos, como `puzzle_started`, `guess_submitted` (sem o texto), `puzzle_completed` e `share_requested`; documentar consentimento, retenção e política de privacidade antes de ativar.

## 10. Segurança e integridade

Como o pacote estático contém o catálogo do cliente, a resposta diária pode ser descoberta inspecionando os recursos. Isso é aceitável somente para um jogo casual sem ranking oficial, premiação ou competição de alto risco. Não chamar dados locais de resultados verificados.

Se integridade for requisito, migrar a fonte de verdade para serviço servidor: o cliente envia `puzzleId` e palpite; o servidor valida a resposta, registra progresso e devolve marcas. Limitar tentativas no servidor, não incluir respostas futuras em endpoints públicos e proteger autenticação/limites de requisição. A API não faz parte do MVP proposto.

## 11. Verificação e critérios de aceite

### Testes unitários

- Normalização de caixa, Unicode, acentos e comprimento.
- Letras certas, presentes e ausentes; combinações com letras repetidas.
- Palpite inválido/duplicado não consome tentativa.
- Vitória na primeira e na sexta tentativa; derrota após seis tentativas.
- Partida encerrada rejeita novo palpite.
- Rollover de data em torno da meia-noite do fuso configurado.
- Estatísticas para vitória, derrota, sequência interrompida e execução idempotente.
- Estado persistido recupera a sessão após reload e migra dados de versão anterior.

### Testes de navegador

- Fluxo completo por teclado e toque em desktop e viewport móvel.
- Atualizar a página durante partida e verificar restauração.
- Compartilhar/copiar resultado sem revelar a solução.
- Validar mensagem de status, foco, contraste, zoom e `prefers-reduced-motion`.
- Testar sem clipboard, sem armazenamento local e com catálogo indisponível.

### Critérios para considerar o MVP pronto

- Uma pessoa consegue jogar sem cadastro e terminar uma partida sem ajuda externa.
- Nenhum palpite inválido altera o tabuleiro ou as estatísticas.
- Feedback para letras repetidas corresponde às regras documentadas.
- Recarga não perde partida nem duplica estatísticas.
- Vitória, derrota e compartilhamento são compreensíveis por texto e não dependem apenas de cor.
- Sem erros de console nos fluxos principais e sem regressão de layout em 360 CSS px.

## 12. Plano de implementação

1. **Fechar decisões de produto:** confirmar público/variante, acentos, política de respostas, fuso e significado de sequência diária.
2. **Preparar aplicação:** adicionar Vite/TypeScript, comandos `dev`, `build`, `test` e lint; preservar visual do protótipo.
3. **Extrair domínio:** normalização, pontuação, validação e máquina de estados com testes unitários, antes de conectar ao DOM.
4. **Preparar catálogo inicial:** curar respostas e palpites, versionar e revisar ambiguidades; substituir a lista de demonstração.
5. **Ligar interface e persistência:** tabuleiro acessível, restauração de sessão, estatísticas idempotentes e mensagens de erro/sucesso.
6. **Finalizar compartilhamento e qualidade:** fallback de cópia, testes de navegador, auditoria de acessibilidade, build e publicação estática por HTTPS.
7. **Decidir evolução:** só adicionar contas, API, sincronização, arquivo ou analytics se os requisitos de produto justificarem.

## 13. Riscos principais

| Risco | Mitigação |
|---|---|
| Resposta ambígua ou desconhecida | Curadoria humana, teste com falantes e opção de reportar problema. |
| Divergência sobre acentos e variantes regionais | Política explícita e testes com casos de língua antes de congelar o catálogo. |
| Resposta exposta no cliente | Assumir risco conscientemente no MVP; mover autoridade ao servidor se houver competição oficial. |
| Perda/duplicação de sequência | Persistência versionada, cálculo idempotente e testes de mudança de data. |
| Dificuldade injusta entre dias | Balancear frequência e familiaridade; revisar palavras com jogadores, não apenas por frequência estatística. |
| Dependência do relógio ou fuso do dispositivo | Calcular dia de desafio usando um fuso de produto configurado e cobrir limites de horário nos testes. |

## 14. Próximas decisões para o PRD

Antes de transformar esta proposta em tarefas de desenvolvimento, decidir: público e variante linguística; regra de acentos; horário/fuso de atualização; fonte e curadoria do vocabulário; necessidade de modo de prática/arquivo; persistência local ou sincronizada; e se competição exige validação no servidor.