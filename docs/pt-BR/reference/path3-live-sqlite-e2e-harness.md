---
read_when:
    - Você está comprovando a migração do armazenamento SQLite do Caminho 3 em um Gateway ativo
    - Você precisa distinguir divergências esperadas do JSONL legado de falhas de runtime
    - Você está criando ou revisando o ambiente de testes E2E ativo do SQLite orientado por agentes
summary: Projeto para comprovação ao vivo no Gateway da migração de sessão/transcrição do Caminho 3 para SQLite
title: Harness E2E do SQLite em execução do Caminho 3
x-i18n:
    generated_at: "2026-07-12T15:43:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2749bf47cb4967bc80a5ed37a12f2a553f3b388ed8cd90cfb3217e1b5e8afae9
    source_path: reference/path3-live-sqlite-e2e-harness.md
    workflow: 16
---

O harness de E2E do SQLite em ambiente real do Caminho 3 comprova que o Gateway está usando o SQLite como
armazenamento canônico de sessões e transcrições, enquanto os arquivos JSONL legados permanecem
como entrada de migração ou material de arquivamento. Ele é um harness de comprovação para mantenedores, não um
diagnóstico comum para usuários.

Depois que um Gateway processa tráfego pós-migração, a paridade com o JSONL legado deixa de ser
um sinal válido da integridade do runtime. Um Gateway migrado e íntegro pode ter
linhas de transcrição no SQLite com contagens diferentes das do JSONL legado, pois os novos turnos
devem atualizar somente o SQLite. Portanto, o harness em ambiente real deve medir o comportamento do Gateway,
a movimentação de linhas no SQLite, a inatividade dos arquivos legados e a integridade dos logs em cada
etapa.

## Formato do comando

O comando pretendido para o ambiente real é:

```bash
node scripts/path3-live-sqlite-e2e.mjs \
  --url http://127.0.0.1:18789 \
  --agent main \
  --session-key agent:main:path3-live-e2e:<timestamp> \
  --json
```

O comando se conecta a um Gateway que já está em execução. Ele não inicia, interrompe,
importa nem executa novamente a migração, a menos que um modo de migração explícito seja adicionado
posteriormente. Uma variante de CI ou local isolada pode usar
`test/helpers/openclaw-test-instance.ts`, mas o caminho de comprovação em ambiente real deve inspecionar
o Gateway real do operador e seu banco de dados SQLite real por agente.

## Comprovação isolada da CLI compilada

O executor de comprovação da CLI compilada inicializa um armazenamento de sessões legado isolado, inicia o
Gateway recompilado e comprova que a inicialização importa as sessões legadas ativas para o
SQLite antes do início das leituras do runtime. Ele não deve executar `openclaw doctor --fix`
antes da primeira inicialização do Gateway, pois isso comprovaria o caminho de migração manual
em vez do caminho de atualização que os usuários recebem na primeira inicialização após a mudança.

Após a importação na inicialização, a comprovação isolada pode executar
`openclaw doctor --session-sqlite inspect` e
`openclaw doctor --session-sqlite validate` como evidência de diagnóstico. Esses
comandos do doctor não são o mecanismo de migração da comprovação de atualização na inicialização.
Cenários separados de importação pelo doctor devem inicializar arquivos de transcrição legados com
arquivos auxiliares de trajetória e verificar se o doctor arquiva esses artefatos enquanto o SQLite
permanece canônico.

## Verificação preliminar

A verificação preliminar coleta uma linha de base e falha antes de enviar um turno de comprovação se o
Gateway não estiver utilizável:

- `GET /health` e o status detalhado do Gateway devem indicar um Gateway em execução e
  acessível.
- As versões da CLI e do Gateway devem corresponder à ramificação que está sendo testada.
- O harness registra um cursor de log para o log de arquivo ativo do Gateway.
- O harness registra contagens das tabelas SQLite por agente para `sessions`,
  `session_entries`, `transcript_events`, `transcript_event_identities` e
  `session_routes`.
- O harness registra `mtime`, `size` e a existência dos arquivos legados
  `sessions.json`, dos arquivos JSONL referenciados e dos possíveis caminhos JSONL da sessão
  de comprovação.
- `lsof -p <gateway-pid>` deve mostrar identificadores do banco de dados SQLite/WAL/SHM e nenhum
  identificador ativo de `.jsonl` ou `sessions.json`.

`openclaw doctor --session-sqlite validate` é apenas informativo no modo em ambiente real.
Após o tráfego posterior à mudança, ele pode relatar divergências esperadas em relação aos arquivos legados. O
harness deve usar a saída do doctor para classificação e inventário da migração,
não como o oráculo de aprovação ou reprovação do runtime.

## Cenário conduzido pelo agente

O cenário em ambiente real usa uma chave de sessão dedicada à comprovação e conduz o Gateway
por caminhos RPC públicos sempre que possível. Um turno do agente deve ser suficiente para
exercitar a persistência comum, mas a comprovação completa deve abranger as interfaces 3.1b
que anteriormente exigiam verificações individuais em ambiente real:

- Turno de chat comum: criar ou reutilizar a sessão de comprovação, enviar um prompt real ao agente,
  aguardar o resultado final do assistente e verificar `chat.history` ou
  uma projeção equivalente do Gateway.
- Identidade da transcrição: verificar se o mesmo marcador aparece no histórico do Gateway e nas
  linhas de transcrição do SQLite, incluindo linhas de identidade de evento estáveis, quando presentes.
- Acessores de metadados da sessão: ler a sessão de comprovação e determinadas sessões existentes em ambiente
  real por meio dos acessores de Gateway/sessão e compará-las às linhas do SQLite.
- Projeção de atualização da sessão: aplicar uma alteração reversível nos metadados do modelo/sessão na
  sessão de comprovação e, em seguida, verificar se a linha projetada e a resposta do Gateway são consistentes.
- Ciclo de vida do ponto de verificação da Compaction: listar, ramificar e restaurar um ponto de verificação somente
  na sessão de comprovação ou em uma sessão de fixture sintética criada pelo harness.
- Recuperação após reinicialização: executar o caminho seguro do marcador de recuperação em uma sessão de comprovação
  controlada ou em uma instância de teste isolada; o modo em ambiente real só pode executar essa etapa quando
  o conjunto de sessões de destino for explícito e reversível.
- Ciclo de vida da limpeza: excluir ou redefinir a sessão de comprovação e, em seguida, verificar as
  linhas do ciclo de vida no SQLite e o estado arquivado da transcrição.

As interfaces específicas de transporte que não podem ser exercitadas com segurança no Gateway real
do operador, como a entrada pelo WhatsApp ou por chamadas de voz, devem usar sondagens de runtime
no nível do proprietário com o mesmo contrato do SQLite, em vez de simular um transporte externo.

## Asserções por etapa

Cada etapa captura o estado anterior e posterior e grava um registro de asserção
estruturado:

- As contagens de linhas do SQLite avançam somente onde esperado.
- As linhas de runtime da trajetória avançam para sessões de comprovação respaldadas por marcadores que registram
  eventos de runtime.
- A linha da sessão de comprovação tem os valores esperados de `session_id`, status, carimbos de data/hora,
  metadados e linhas de rota.
- A projeção de histórico/sessão do Gateway corresponde ao final da transcrição no SQLite.
- Nenhum arquivo JSONL da sessão de comprovação é criado ou modificado.
- Nenhum arquivo auxiliar `.trajectory.jsonl`, `.trajectory-path.json` ou
  `trajectory/<session>.jsonl` derivado do marcador é criado para a sessão de comprovação.
- Os arquivos JSONL legados existentes e `sessions.json` permanecem inalterados, a menos que a
  etapa seja explicitamente uma operação de migração ou arquivamento offline.
- O processo do Gateway não abre identificadores de `.jsonl` ou `sessions.json`.
- Os logs desde o cursor anterior não contêm `ERROR`, `FATAL`, `SQLITE_`,
  `no such column`, indisponibilidade do armazenamento de sessões, falha de recuperação após reinicialização ou
  aviso de reconciliação de transcrição, a menos que o cenário o inclua explicitamente na lista de permissões.

A varredura dos logs faz parte do contrato de aprovação ou reprovação. Um Gateway que responde às verificações de
integridade, mas emite erros de esquema do SQLite ou falhas repetidas de reconciliação de transcrição,
não está aprovado para o Caminho 3.

## Artefato de evidência

O harness deve gravar as evidências em `.artifacts/path3-live-e2e/<timestamp>/`
e mantê-las fora do git:

- `summary.json`: argumentos do comando, versão do Gateway, resultado, asserção com falha e
  caminhos dos artefatos.
- `sqlite-before.json` e `sqlite-after.json`: contagens de linhas e linhas de comprovação
  selecionadas.
- `legacy-files.json`: existência dos arquivos legados, `mtime`, tamanho e indicação se cada
  arquivo foi alterado.
- `gateway-log-scan.json`: intervalo de cursores, linhas de log correspondentes e decisões da lista
  de permissões.
- `events.jsonl`: observações ordenadas por etapa, adequadas para comentários de comprovação no PR.

A comprovação no PR deve resumir esses artefatos em vez de colar transcrições completas
ou conteúdo de mensagens privadas.

## Regras de segurança

- O modo em ambiente real nunca deve reimportar JSONL legado enquanto o Gateway estiver em execução.
- O modo em ambiente real não deve modificar sessões que não sejam de comprovação, exceto em sondagens de reparo
  reversíveis e explicitamente selecionadas.
- Qualquer etapa destrutiva ou ampla de migração exige um backup recente do banco de dados
  SQLite afetado e do diretório de sessões legadas.
- Os backups devem se limitar ao banco de dados/diretório de sessões do agente afetado e ser reutilizados
  durante uma execução de comprovação para evitar o crescimento ilimitado do uso de disco.
- A etapa de limpeza não deve deixar nenhuma sessão de comprovação, JSONL de comprovação ou arquivo legado
  modificado, a menos que o chamador passe `--keep-artifacts`.

## Resultado aprovado

Uma execução aprovada em ambiente real significa que o Gateway aceitou um fluxo de sessão real conduzido pelo agente,
que todo o estado canônico observado estava no SQLite, que os arquivos legados do runtime permaneceram
inativos e que a integridade dos logs permaneceu intacta durante o intervalo medido. Isso não significa que
a paridade com o JSONL legado permaneça intacta após o tráfego em ambiente real; a divergência em ambiente real é esperada
quando o SQLite se torna o armazenamento canônico.
