# PRD: Jogo diário de palavras

**Data:** 2026-10-20  
**Status:** MVP implementável; decisões de produto ainda provisórias  
**Documento técnico:** `PROJETO_TECNICO.md`  
**Protótipo de referência:** `index.html`, conceito “Caderno de pistas”

## Problema e objetivo

Entregar um jogo casual de dedução em português brasileiro, jogável sem cadastro em celular e desktop. A pessoa tenta descobrir uma palavra diária e recebe pistas por posição das letras. O MVP prioriza uma partida simples, acessível e restaurável após recarregar a página.

## Público e plataforma

- Público inicial: pessoas que leem português brasileiro.
- Plataforma: aplicação web responsiva, sem conta e sem backend.
- Persistência: armazenamento local no dispositivo; sem telemetria.

## Regras do jogo

- Um desafio por dia, identificado pela data UTC e renovado às 00:00 UTC.
- A resposta tem cinco letras e há até seis tentativas válidas.
- Comparação não diferencia maiúsculas/minúsculas nem diacríticos; letras acentuadas contam como uma letra. A apresentação usa a grafia editorial da resposta.
- Palpites precisam estar no vocabulário permitido. Palpites inválidos e duplicados não consomem tentativas.
- Cada letra recebe estado correto na posição, presente em outra posição ou ausente. Ocorrências repetidas são contabilizadas sem exceder as letras da resposta.
- A partida termina ao acertar ou após a sexta tentativa. Partidas concluídas não aceitam novos palpites.
- Compartilhamento não contém a resposta nem os palpites em texto.

## Requisitos do MVP

1. Exibir um tabuleiro de seis linhas por cinco letras, campo de palpite e tentativas restantes.
2. Validar comprimento, caracteres, vocabulário e palpites repetidos antes de avançar.
3. Informar visualmente e por texto acessível o estado de cada letra.
4. Persistir a partida do dia e estatísticas no mesmo dispositivo; restaurar a partida após recarga.
5. Atualizar estatísticas uma única vez por desafio concluído: partidas, vitórias, percentual de vitórias, sequência atual/máxima e distribuição de vitórias por tentativa.
6. Compartilhar/copiar um resumo sem spoiler, com fallback quando a API de compartilhamento não estiver disponível.
7. Oferecer reinício da partida do dia com confirmação; não apagar estatísticas sem ação explícita.
8. Funcionar por teclado e toque, mostrar foco, anunciar mensagens de estado, respeitar movimento reduzido e não depender somente de cor.

## Fora de escopo

Contas, sincronização, ranking, prêmios, modo competitivo, PWA/offline, API, telemetria, arquivo de desafios, os conceitos “Mesa de recortes” e “Sinal de sentido”, e catálogo editorial de produção.

## Decisões provisórias e riscos

- UTC foi escolhido para tornar a virada do desafio determinística. Confirmar fuso com o público antes de lançamento.
- A comparação ignora diacríticos; revisar casos linguísticos ambíguos com falantes antes de congelar a regra.
- A resposta e o vocabulário ficam no cliente e podem ser inspecionados. Adequado apenas a um jogo casual sem competição oficial.
- O catálogo inicial de demonstração é deliberadamente pequeno e precisa de curadoria editorial/licença antes de publicação pública prolongada.
- As estatísticas são locais e podem ser apagadas pelo navegador; não há sincronização ou recuperação entre dispositivos.

## Critérios de aceite

- Partida pode ser concluída em uma a seis tentativas; após seis erros, a resposta é revelada.
- Entrada malformada, palavra não permitida ou tentativa duplicada não altera o tabuleiro nem as estatísticas.
- Regras de letras repetidas produzem marcas limitadas pela quantidade presente na resposta.
- Atualizar a página durante ou após a partida preserva o estado e não duplica uma conclusão.
- A mudança da data UTC inicia outro desafio sem substituir estatísticas anteriores.
- O compartilhamento não expõe a resposta e tem fallback de cópia.
- Build de produção e testes unitários passam; layout permanece utilizável em viewport estreita.

## Verificação

Cobrir normalização, pontuação com duplicatas, validação, limites de tentativas, transições vitória/derrota, idempotência de estatísticas, recuperação e dados locais inválidos. Verificar os fluxos principais em navegador, inclusive recarga e compartilhamento.
