# Bateria de testes do jogo de palavras

**Data:** 2026-10-27  
**Escopo:** testes automatizados da lógica do jogo, catálogo, estatísticas e armazenamento local, mais roteiro manual da interface.

## Objetivo

Manter verificáveis as regras essenciais do jogo e evitar regressões ao alterar o domínio. A suíte automatizada usa Vitest e testa módulos TypeScript diretamente; não precisa abrir navegador, acessar rede nem consultar serviços externos.

## Pré-requisitos e comandos

- Node.js 20.19+ ou 22.12+.
- Dependências instaladas com `npm install` (ou `npm ci` quando houver `package-lock.json`).

Na raiz do repositório:

```sh
npm test
npm run build
```

`npm test` executa todos os arquivos `*.test.ts` uma vez, sem modo watch e sem iniciar um ambiente isolado para cada arquivo. Isso reduz o custo de inicialização da suíte atual; os testes limpam os globais simulados após cada cenário. Se testes futuros dependerem de estado global ou precisarem de isolamento entre arquivos, rode `npx vitest run` (isolamento padrão) e mantenha essa garantia.

`npm run build` primeiro verifica os tipos com `tsc --noEmit` e depois gera a versão de produção com Vite. Os dois comandos são critérios de aceite: ambos precisam terminar com código de saída zero.

Para executar somente uma área durante o desenvolvimento:

```sh
npx vitest run src/game
npx vitest run src/storage/repository.test.ts
```

Vitest apresenta o número de testes aprovados/reprovados. Em caso de falha, consulte o nome do cenário e a comparação esperada/obtida; corrija a regra ou o teste conforme o comportamento definido, sem apagar uma asserção apenas para deixar a suíte verde.

## Cobertura automatizada

| Área | Arquivo(s) | Cenários cobertos |
|---|---|---|
| Normalização e formato | `src/game/normalize.test.ts` | Caixa alta, remoção de diacríticos, Unicode acentuado composto/decomposto, cinco letras incluindo acentos, e rejeição de espaços, pontuação e caracteres fora do alfabeto esperado. |
| Marcação das letras | `src/game/score.test.ts` | Letras corretas, presentes em outra posição ou ausentes; letras repetidas sem atribuir correspondências além das ocorrências da resposta; comparação sem diferenciar acentos. |
| Ciclo da partida | `src/game/session.test.ts` | Entrada de formato inválido, palpite repetido, palavra fora do vocabulário, normalização de caixa/espaços/acentos, vitória, derrota na sexta tentativa, vitória na sexta tentativa e bloqueio após concluir. Erros não consomem tentativas. |
| Catálogo diário | `src/puzzles/catalog.test.ts` | Mesmo desafio durante o mesmo dia UTC, mudança no dia seguinte, palavra permitida com/sem acento, rejeição de palavra ausente, tamanho do vocabulário de demonstração e consistência do identificador/resposta. |
| Estatísticas | `src/stats/aggregate.test.ts` | Registro de vitória e distribuição por tentativa, idempotência para o mesmo desafio, sequência em dias consecutivos UTC, reinício após intervalo, derrota sem incrementar vitórias/distribuição, preservação da melhor sequência, partida em andamento sem efeito e percentual sem partidas. |
| Persistência local | `src/storage/repository.test.ts` | Estado inexistente, JSON inválido, falha de leitura, dados estruturados inválidos, sessão antiga com estatísticas preservadas, rejeição de estado impossível (seis palpites ainda em andamento), gravação serializada com a chave versionada e falha de escrita. |

As validações do armazenamento são intencionalmente importantes: dados locais podem estar corrompidos ou indisponíveis, e não devem ser tratados como estado válido nem causar exceção não controlada.

## Roteiro manual da interface

Os testes automatizados atuais não inicializam DOM real nem simulam navegador. Antes de publicar mudanças na interface, execute `npm run dev` e verifique em navegador:

1. **Entrada:** enviar uma palavra com Enter e pelo botão; conferir a linha adicionada, as marcas e a mensagem de tentativas restantes.
2. **Validação:** enviar texto curto, caracteres inválidos, palavra fora do catálogo e palavra repetida; conferir mensagem clara e que o tabuleiro não avança.
3. **Fim de jogo:** testar vitória e seis palpites errados; conferir mensagem final, resposta revelada somente ao perder e controles desabilitados após terminar.
4. **Recarregamento e novo dia:** recarregar com partida em andamento e confirmar restauração; conferir que outro `puzzleId` inicia tabuleiro novo mantendo estatísticas.
5. **Estatísticas:** concluir partidas e confirmar total, taxa de vitórias, sequências e distribuição; recarregar e verificar que o resultado não é contado novamente.
6. **Reinício:** cancelar a confirmação e verificar que nada muda; confirmar o reinício e garantir que tentativas são limpas e estatísticas permanecem.
7. **Compartilhamento:** tentar compartilhar sem palpites; após uma tentativa, conferir que o texto compartilhado contém somente grade/estado e nunca a resposta. Verificar o fallback de cópia quando disponível.
8. **Acessibilidade e responsividade:** percorrer por teclado, verificar foco visível, rótulos e anúncios para leitor de tela, não depender só de cor e conferir layout em viewport estreita.
9. **Falha de armazenamento:** quando possível, simular armazenamento bloqueado/indisponível e conferir que a interface avisa que o progresso não pôde ser salvo.

## Limites e próximos passos

- A suíte é de unidade; não comprova integração real do DOM, layout, APIs de compartilhamento/clipboard, leitor de tela ou comportamento em navegadores diferentes. O roteiro manual cobre esses fluxos sem afirmar que são testes automatizados.
- O catálogo é uma amostra editorial curta; os testes verificam consistência interna, não qualidade linguística, licença nem suficiência de palavras.
- A data diária usa UTC. Os cenários verificam estabilidade por dia UTC, não a decisão de produto sobre fuso de lançamento.
- Não há meta numérica de cobertura configurada; a aceitação é baseada nos comportamentos listados e em `npm test`/`npm run build` aprovados. Se o produto exigir cobertura percentual, definir o limite antes de adicionar uma regra de cobertura.
