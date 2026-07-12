---
read_when:
    - Você está implementando clawdbot-d63.2 / clawdbot-04b
    - Você está alterando a retenção, redefinição, exclusão ou o arquivamento após a exclusão de agentes de sessões do SQLite
    - Você precisa distinguir as famílias de artefatos da era do SQLite dos arquivos auxiliares JSONL legados
summary: Plano do Caminho 3 para arquivar todos os artefatos de transcrição do SQLite que pertencem a uma sessão
title: Família de artefatos de sessão SQLite do caminho 3
x-i18n:
    generated_at: "2026-07-12T15:24:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: adb2c31293ab63cb80449d037600d78fbb228e91f380d1ccaf15fb00728a9057
    source_path: plan/path3-sqlite-session-artifact-family.md
    workflow: 16
---

# Família de artefatos de sessão SQLite do Caminho 3

Esta nota delimita `clawdbot-d63.2`, enquanto `clawdbot-d63.1` é responsável pelo auxiliar de arquivamento sobreposto de redefinição/exclusão em `src/config/sessions/session-accessor.sqlite.ts`.
O arquivo de implementação tinha alterações não confirmadas durante esta etapa, portanto este artefato registra o contrato exato e os pontos de alteração sem causar uma condição de corrida com o worker paralelo.

## Família autoritativa

Após a migração para SQLite, as transcrições de sessões ativas são linhas do SQLite. A família de arquivamento de uma sessão é:

- As linhas de `transcript_events`, `transcript_event_identities` e `sessions`
  referentes ao `sessionId` atual da entrada.
- O mesmo conjunto de linhas de transcrição do SQLite para cada `sessionId` referenciado por
  `entry.compactionCheckpoints[*].preCompaction.sessionId`.
- O mesmo conjunto de linhas de transcrição do SQLite para cada `sessionId` referenciado por
  `entry.compactionCheckpoints[*].postCompaction.sessionId`.
- O mesmo conjunto de linhas de transcrição do SQLite para cada `sessionId` em
  `entry.usageFamilySessionIds`.

Arquive apenas linhas que não sejam mais referenciadas por nenhuma linha
`session_entries` restante nem pelos metadados de Compaction ou da família de uso de qualquer entrada restante. Isso preserva o estado de ramificação/restauração de checkpoints e de consolidação de uso até que
a última referência ativa desapareça.

## Artefatos que não pertencem à família após a migração

As variantes geradas de arquivos de transcrição de tópicos e os arquivos auxiliares de trajetória não fazem parte do estado ativo de execução do SQLite. Eles são artefatos de arquivos legados:

- Variantes de tópico como `<sessionId>-topic-<thread>.jsonl` existem apenas para o
  formato de transcrição baseado em arquivos. O SQLite usa o ID de sessão canônico e
  `session_routes`/os metadados de entrega da entrada em vez de arquivos JSONL por tópico.
- Arquivos auxiliares de trajetória, como `.trajectory.jsonl` e `.trajectory-path.json`,
  são nomeados com base em caminhos reais de `sessionFile` JSONL. Os valores de `sessionFile` do SQLite são
  marcadores `sqlite:<agentId>:<sessionId>:<storePath>` e não nomeiam arquivos
  auxiliares.
- Os leitores da camada de arquivamento devem continuar lendo arquivos JSONL legados arquivados, mas
  a retenção em tempo de execução não deve examinar diretórios de sessões ativas nem reabrir arquivos de
  transcrição JSONL para sessões SQLite.

A importação do Doctor continua sendo a responsável pela migração dos arquivos JSONL primários legados e
de seus arquivos auxiliares de trajetória adjacentes. A retenção SQLite em tempo de execução não deve adicionar um
segundo importador nem um fallback de arquivos.

## Pontos de alteração

Estenda o auxiliar de arquivamento SQLite introduzido por `clawdbot-d63.1`, em vez de
adicionar um caminho paralelo.

1. Adicione um coletor local próximo a `deleteSqliteSessionStateIfUnreferenced`:
   - `collectSqliteSessionArtifactFamily(entry: SessionEntry): Set<string>`
   - Inclua `entry.sessionId`, os IDs de sessão pré/pós-checkpoint e
     `usageFamilySessionIds`.
   - Filtre strings vazias e remova duplicatas de forma determinística.

2. Adicione um coletor de referências para o armazenamento após a remoção:
   - `readReferencedSqliteSessionArtifactFamilyIds(database): Set<string>`
   - Percorra os `session_entries` atuais, analise cada `entry_json` e colete
     os mesmos IDs de família de cada entrada sobrevivente.

3. Altere os chamadores de redefinição/exclusão/manutenção que atualmente arquivam um único
   `sessionId` removido para que forneçam a família completa da entrada removida.

4. Para cada ID da família, arquive as linhas de transcrição do SQLite usando o motivo do chamador
   (`reset` ou `deleted`) e, em seguida, exclua a linha de `sessions` somente quando o
   ID da família estiver ausente do conjunto de referências após a remoção.

5. Mantenha a exclusão de eventos de transcrição centralizada por meio do caminho existente de limpeza
   de linhas de sessão do SQLite. Não adicione leituras de JSONL ativos.

## Testes focados

Adicione testes exclusivos para SQLite em `src/config/sessions/session-accessor.conformance.test.ts`
ou no teste de ciclo de vida relacionado após o commit de `clawdbot-d63.1`:

- Excluir uma entrada com uma transcrição pré-Compaction arquiva tanto a sessão atual
  quanto a sessão pré-Compaction e, em seguida, remove os dois conjuntos de linhas do SQLite.
- Excluir uma de duas entradas que compartilham uma pré-sessão de Compaction não arquiva
  nada da pré-sessão compartilhada até que a última entrada que a referencia seja
  removida.
- Excluir uma entrada com `usageFamilySessionIds` arquiva as linhas de transcrição SQLite
  predecessoras quando nenhuma outra entrada referencia essa família de uso.
- Uma chave de sessão com formato de tópico e um marcador SQLite não causa nenhuma leitura de
  JSONL de tópico gerado nem busca de arquivo auxiliar.

A comprovação focada deve usar:

```bash
node scripts/run-vitest.mjs src/config/sessions/session-accessor.conformance.test.ts
```

Se os testes finais estiverem em `store.session-lifecycle-mutation.test.ts`, execute esse
arquivo explicitamente com o mesmo wrapper. As verificações amplas do `pnpm` devem permanecer no
Crabbox/Testbox para esta árvore de trabalho do Codex.
