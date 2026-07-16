---
read_when:
    - Você está enfrentando problemas de conectividade/autenticação e quer soluções guiadas
    - Você atualizou e quer uma verificação rápida de consistência
summary: Referência da CLI para `openclaw doctor` (verificações de integridade + reparos guiados)
title: Diagnóstico
x-i18n:
    generated_at: "2026-07-16T12:20:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 322af63f52a3d864e46da332353ca921a4462e13fa849986d936524759f80ccc
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Verificações de integridade e correções rápidas para o Gateway, canais, plugins, Skills, roteamento de modelos, estado local e migrações de configuração. Use-o sempre que algo não estiver se comportando conforme o esperado e você quiser que um único comando explique o que está errado.

Relacionados:

- Solução de problemas: [Solução de problemas](/pt-BR/gateway/troubleshooting)
- Auditoria de segurança: [Segurança](/pt-BR/gateway/security)

## Posturas

O Doctor tem cinco posturas:

| Postura                   | Comando                                   | Comportamento                                                                        |
| ------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------- |
| Inspeção                   | `openclaw doctor`                         | Verificações voltadas para pessoas e prompts guiados.                                       |
| Reparo                    | `openclaw doctor --fix`                   | Aplica reparos compatíveis, usando prompts, a menos que o reparo não interativo seja seguro. |
| Lint                      | `openclaw doctor --lint`                  | Constatações estruturadas somente leitura para CI, verificação preliminar e pontos de controle de revisão.              |
| Manutenção do SQLite compartilhado | `openclaw doctor --state-sqlite compact`  | Executa explicitamente checkpoint, compactação e verificação do banco de dados de estado compartilhado canônico.   |
| Migração do SQLite de sessões  | `openclaw doctor --session-sqlite <mode>` | Inspeciona, importa, valida, compacta, recupera ou restaura o estado das sessões.    |

Prefira `--lint` quando a automação precisar de um resultado estável. Prefira `--fix` quando um operador humano quiser que o Doctor edite a configuração ou o estado.

## Exemplos

```bash
openclaw doctor
openclaw doctor --lint
openclaw doctor --lint --json
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --deep
openclaw doctor --fix
openclaw doctor --fix --non-interactive
openclaw doctor --generate-gateway-token
openclaw doctor --post-upgrade
openclaw doctor --post-upgrade --json
openclaw doctor --state-sqlite compact
openclaw doctor --state-sqlite compact --json
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents
openclaw doctor --session-sqlite dry-run --session-sqlite-agent main --json
openclaw doctor --session-sqlite import --session-sqlite-all-agents
openclaw doctor --session-sqlite validate --session-sqlite-all-agents --json
openclaw doctor --session-sqlite compact --session-sqlite-all-agents
openclaw doctor --session-sqlite recover --github-issue
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Para permissões específicas de canais, use as sondagens de canal em vez de `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

`channels capabilities` informa as permissões efetivas do bot para um destino de canal específico. `channels status --probe` audita todos os canais configurados e destinos de entrada automática em voz.

## Opções

| Opção                          | Efeito                                                                                                                                                                                  |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-workspace-suggestions`    | Desativa sugestões de memória/pesquisa do espaço de trabalho.                                                                                                                                            |
| `--yes`                         | Aceita os padrões sem solicitar confirmação.                                                                                                                                                      |
| `--repair` / `--fix`            | Aplica os reparos recomendados que não envolvem serviços sem solicitar confirmação (`--fix` é um alias). Instalações/reescritas do serviço do Gateway ainda exigem confirmação interativa ou comandos `gateway` explícitos. |
| `--force`                       | Aplica reparos agressivos, incluindo a substituição de configurações personalizadas de serviços.                                                                                                                  |
| `--non-interactive`             | Executa sem prompts; somente migrações seguras e reparos que não envolvem serviços.                                                                                                                      |
| `--generate-gateway-token`      | Gera e configura um token do Gateway.                                                                                                                                                 |
| `--allow-exec`                  | Permite que o Doctor execute SecretRefs `exec` configuradas durante a verificação de segredos.                                                                                                           |
| `--deep`                        | Verifica os serviços do sistema em busca de instalações adicionais do Gateway; informa transferências recentes de reinicialização do supervisor do Gateway.                                                                                     |
| `--lint`                        | Executa verificações de integridade modernizadas no modo somente leitura e emite constatações de diagnóstico.                                                                                                            |
| `--post-upgrade`                | Executa sondagens de compatibilidade de plugins após a atualização; as constatações são enviadas para a saída padrão; código de saída 1 se houver alguma constatação de nível de erro.                                                                 |
| `--state-sqlite <mode>`         | Executa manutenção explícita do SQLite de estado compartilhado. O único modo é `compact`.                                                                                                               |
| `--session-sqlite <mode>`       | Executa o modo de migração direcionada do SQLite de sessões: `inspect`, `dry-run`, `import`, `validate`, `compact`, `recover` ou `restore`.                                                         |
| `--session-sqlite-store <path>` | Com `--session-sqlite`: seleciona um caminho de armazenamento `sessions.json` legado.                                                                                                                  |
| `--session-sqlite-agent <id>`   | Com `--session-sqlite`: seleciona um agente configurado.                                                                                                                                   |
| `--session-sqlite-all-agents`   | Com `--session-sqlite`: seleciona armazenamentos de agentes configurados e descobertos.                                                                                                                 |
| `--github-issue`                | Com `--session-sqlite recover`: prepara um relatório de problema higienizado para openclaw/openclaw; o Doctor o cria com `gh` após `--yes` ou confirmação interativa.                             |
| `--json`                        | Com `--lint`: constatações em JSON. Com `--post-upgrade`: `{ probesRun, findings }`. Com `--state-sqlite` ou `--session-sqlite`: o relatório de manutenção em JSON.                            |
| `--severity-min <level>`        | Com `--lint`: descarta constatações abaixo de `info`, `warning` ou `error`.                                                                                                                       |
| `--all`                         | Com `--lint`: executa todas as verificações registradas, incluindo verificações opcionais excluídas do conjunto padrão.                                                                                        |
| `--skip <id>`                   | Com `--lint`: ignora um ID de verificação. Pode ser repetido.                                                                                                                                             |
| `--only <id>`                   | Com `--lint`: executa somente os IDs de verificação fornecidos. Pode ser repetido.                                                                                                                              |

`--severity-min`, `--all`, `--only` e `--skip` são aceitos somente junto com `--lint`; `--json` é aceito com `--lint`, `--post-upgrade`, `--state-sqlite` e `--session-sqlite`.

## Modo lint

`openclaw doctor --lint` é somente leitura: sem prompts, sem reparos e sem reescritas de configuração/estado.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

A saída para pessoas é compacta:

```text
doctor --lint: executou 6 verificação(ões), 1 constatação(ões)
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode não está definido; a inicialização do Gateway será bloqueada.
    correção: Execute `openclaw configure` e defina o modo do Gateway (local/remoto) ou execute `openclaw config set gateway.mode local`.
```

A saída JSON é a interface para scripts:

```json
{
  "ok": false,
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": [
    {
      "checkId": "core/doctor/gateway-config",
      "severity": "warning",
      "message": "gateway.mode não está definido; a inicialização do Gateway será bloqueada.",
      "path": "gateway.mode",
      "fixHint": "Execute `openclaw configure` e defina o modo do Gateway (local/remoto) ou execute `openclaw config set gateway.mode local`."
    }
  ]
}
```

Códigos de saída:

| Código | Significado                                                       |
| ---- | ------------------------------------------------------------- |
| `0`  | Nenhuma constatação no limite de gravidade selecionado ou acima dele.      |
| `1`  | Pelo menos uma constatação atende ao limite selecionado.            |
| `2`  | Falha do comando/tempo de execução antes que as constatações do lint possam ser produzidas. |

`--severity-min` controla quais constatações são exibidas e o limite de saída: `openclaw doctor --lint --severity-min error` pode não exibir nada e sair com `0` mesmo quando existirem constatações `info`/`warning` de menor gravidade.

`--all` controla quais verificações são selecionadas antes da filtragem por gravidade. A execução padrão do lint exclui verificações profundas, históricas ou com maior probabilidade de revelar resíduos legados reparáveis; use `--all` para o inventário completo. `--only <id>` é o seletor mais preciso e pode executar qualquer verificação registrada por ID.

`core/doctor/local-audio-acceleration` informa o comando de STT local selecionado automaticamente, evidências separadas de backends compatíveis/solicitados/observados e a ordem de fallback sem carregar um modelo de fala. Ele emite uma constatação informativa, portanto inclua `--severity-min info` para exibi-la.

## Verificações de integridade estruturadas

As verificações modernas do Doctor usam um pequeno contrato dividido:

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` alimenta `doctor --lint`. `repair()` é opcional e só é executado em `doctor --fix` / `doctor --repair`. As verificações que ainda não migraram para esse formato continuam usando o fluxo legado de contribuições do Doctor.

Os contextos de reparo podem incluir solicitações `dryRun`/`diff`; os resultados de reparo podem retornar `diffs` estruturadas (edições de configuração/arquivo) e `effects` (efeitos colaterais em serviços, processos, pacotes, estado ou outros), permitindo que as verificações convertidas evoluam em direção a `doctor --fix --dry-run` sem mover o planejamento de mutações para `detect()`.

`repair()` relata `status: "repaired" | "skipped" | "failed"` (a ausência de status significa `repaired`). Quando o reparo retorna `skipped` ou `failed`, o doctor relata o motivo e ignora a validação dessa verificação. Após um reparo bem-sucedido, o doctor executa novamente `detect()` com escopo limitado às constatações reparadas; se a constatação ainda estiver presente, o doctor relata um aviso de reparo em vez de considerar a alteração concluída.

Uma constatação inclui:

| Campo             | Finalidade                                                |
| ----------------- | ------------------------------------------------------ |
| `checkId`         | ID estável para filtros de ignorar/exclusividade e listas de permissões da CI.     |
| `severity`        | `info`, `warning` ou `error`.                         |
| `message`         | Descrição do problema legível por humanos.                      |
| `path`            | Configuração, arquivo ou caminho lógico, quando disponível.          |
| `line` / `column` | Localização de origem, quando disponível.                        |
| `ocPath`          | Endereço `oc://` preciso quando uma verificação pode apontar para um. |
| `fixHint`         | Ação sugerida ao operador ou resumo do reparo.           |

As verificações modernizadas do doctor principal permanecem vinculadas à contribuição ordenada do doctor responsável por seu comportamento `doctor` / `doctor --fix` para humanos. O registro compartilhado de integridade estruturada é o ponto de extensão: verificações integradas e fornecidas por plugins são executadas após as verificações principais do doctor assim que o pacote responsável as registra no caminho de comando ativo. `openclaw/plugin-sdk/health` expõe o mesmo contrato para autores de plugins.

## Seleção de verificações

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` e `--skip` aceitam IDs completos de verificações e podem ser repetidos. Se um ID `--only` não estiver registrado, nenhuma verificação será executada para esse ID; use `checksRun`/`checksSkipped` na saída para confirmar que uma etapa focada seleciona as verificações esperadas.

## Modo pós-atualização

`openclaw doctor --post-upgrade` executa sondagens de compatibilidade de plugins para encadeamento após uma compilação ou atualização. As constatações são enviadas para stdout; o código de saída é 1 se alguma constatação tiver `level: "error"`. Adicione `--json` para obter um envelope legível por máquina (`{ probesRun, findings }`), adequado para CI, para a skill comunitária `fork-upgrade` e para outras ferramentas de teste de fumaça pós-atualização. Se o índice de plugins instalados estiver ausente ou malformado, o modo JSON ainda emitirá o envelope com uma constatação de erro `plugin.index_unavailable`.

A inicialização da imagem de contêiner é a exceção ao fluxo habitual de "executar o doctor após
a atualização". Quando `openclaw gateway run` é iniciado em uma nova versão do OpenClaw, ele
executa reparos seguros de estado e plugins antes de informar que está pronto. Se o reparo não puder
ser concluído com segurança, a inicialização será encerrada e instruirá a executar a mesma imagem uma vez com
`openclaw doctor --fix` usando o mesmo estado/configuração montado antes de reiniciar
o contêiner normalmente.

## Compaction do SQLite de estado compartilhado

`openclaw doctor --state-sqlite compact` é uma manutenção offline explícita para
o banco de dados canônico de estado compartilhado em
`<state-dir>/state/openclaw.sqlite`. Ele não aceita um caminho arbitrário de banco de dados,
nunca é invocado pela operação normal do Gateway e não faz parte de
`openclaw doctor --fix`. O comando adquire o mesmo bloqueio de propriedade do estado usado na
inicialização do Gateway e o mantém durante a validação, o checkpoint, `VACUUM` e
as verificações finais de integridade. Ele se recusa a ser executado enquanto um Gateway ou outro
comando de manutenção do SQLite mantiver esse bloqueio. O bloqueio do estado permanece ativo quando
`OPENCLAW_ALLOW_MULTI_GATEWAY=1` ignora a instância única do Gateway por configuração, portanto um
shell do operador não precisa herdar o ambiente do serviço do Gateway para que
a manutenção o detecte.

Primeiro, interrompa o Gateway e crie um backup verificado:

```bash
openclaw gateway stop
openclaw backup create --verify
openclaw doctor --state-sqlite compact --json
openclaw gateway start
```

O comando:

1. Exige um arquivo regular no caminho canônico do estado compartilhado. Um banco de dados
   ausente é relatado como `skipped` e o comando é encerrado com sucesso.
2. Valida a versão atual do esquema compatível e
   `schema_meta.role = "global"` antes de criar um checkpoint ou alterar o arquivo.
3. Exige um `wal_checkpoint(TRUNCATE)` não ocupado. Interrompa qualquer processo restante do OpenClaw
   e tente novamente se o checkpoint estiver ocupado.
4. Define `auto_vacuum` como `INCREMENTAL`, executa um `VACUUM` completo e cria
   outro checkpoint.
5. Executa `quick_check`, `integrity_check` e `foreign_key_check` e, em seguida,
   reaplica permissões exclusivas do proprietário ao banco de dados e aos arquivos auxiliares do SQLite.

A saída JSON relata os tamanhos do banco de dados e do WAL, as páginas da lista livre, o tamanho da página e
o valor de `auto_vacuum` antes e depois da Compaction, além dos bytes recuperados e dos
resultados de `quick_check` e `integrity_check`. `foreign_key_check` é aplicado
em modo de falha segura e não possui um campo de sucesso separado. O SQLite relata `auto_vacuum` como
`0` para nenhum, `1` para completo e `2` para incremental.

A Compaction falha sem realizar alterações quando o esquema é antigo, mais recente que a
compilação do OpenClaw em execução ou pertence a um banco de dados de agente. Execute
`openclaw doctor --fix` primeiro para um esquema de estado compartilhado mais antigo. Restaure um
backup compatível ou atualize o OpenClaw para um esquema mais recente.

## Migração do SQLite de sessões

O OpenClaw importa automaticamente linhas de sessões legadas e o histórico de transcrições para o
banco de dados SQLite de cada agente durante a inicialização do Gateway e durante
`openclaw doctor --fix`. `openclaw doctor --session-sqlite <mode>` é a
ferramenta específica de inspeção e validação dessa migração. As linhas de sessões do runtime atual
ficam em
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Arquivos
`sessions.json` legados são fontes de migração. Arquivos JSONL de transcrições ativas são
importados e arquivados fora do diretório de sessões ativas após a
importação bem-sucedida; arquivos JSONL da camada de arquivamento permanecem como artefatos de suporte, não como
alternativas de runtime.

Modos:

| Modo       | Comportamento                                                                                                               |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| `inspect`  | Lê as contagens legadas e do SQLite, além de arquivos JSONL não referenciados, sem importar.                                       |
| `dry-run`  | Analisa entradas legadas e arquivos JSONL de transcrições, conta linhas importáveis e relata problemas sem gravar linhas no SQLite. |
| `import`   | Importa entradas legadas e eventos de transcrições para o SQLite nos destinos selecionados.                                      |
| `validate` | Compara as fontes legadas selecionadas com as linhas do SQLite e as contagens de eventos de transcrições.                                   |
| `compact`  | Cria checkpoints e executa VACUUM nos bancos de dados SQLite dos agentes selecionados para recuperar páginas livres após grandes exclusões ou limpeza de arquivos.    |
| `recover`  | Restaura a execução de migração com falha mais recente, valida seus destinos e prepara um relatório sanitizado de problema no GitHub.            |
| `restore`  | Restaura artefatos de transcrições arquivados a partir dos manifestos de migração registrados sem excluir dados do SQLite.                  |

Seletores:

- Padrão: o armazenamento configurado do agente padrão, quando esse arquivo de armazenamento legado existe.
- `--session-sqlite-agent <id>`: um agente configurado.
- `--session-sqlite-all-agents`: armazenamentos de agentes configurados mais armazenamentos de agentes descobertos.
- `--session-sqlite-store <path>`: um caminho legado explícito de `sessions.json`.

Sequência de inspeção manual:

```bash
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents
openclaw doctor --session-sqlite dry-run --session-sqlite-all-agents --json
openclaw doctor --session-sqlite import --session-sqlite-all-agents
openclaw doctor --session-sqlite validate --session-sqlite-all-agents --json
openclaw doctor --session-sqlite compact --session-sqlite-all-agents
openclaw doctor --session-sqlite recover --github-issue
```

Faça backup do diretório de estado do OpenClaw antes de executar `import` em uma instalação com
histórico importante. `validate` retorna um código diferente de zero quando uma entrada legada selecionada
está ausente no SQLite, um ID de sessão é diferente ou uma contagem de eventos de transcrição é diferente.
Ao usar `--session-sqlite-store <path>`, verifique se o relatório contém a
contagem de destinos esperada; um caminho explícito de armazenamento inexistente não seleciona nenhum destino.

As exclusões do SQLite primeiro recuperam páginas dentro do banco de dados; elas não necessariamente
reduzem o arquivo do banco de dados imediatamente. Após excluir ou arquivar transcrições grandes,
execute `openclaw doctor --session-sqlite compact --session-sqlite-all-agents`
para criar checkpoints dos arquivos WAL, executar `VACUUM` e relatar os tamanhos do banco de dados e do WAL
antes e depois. A Compaction exige um arquivo regular com o esquema atual do agente, os
metadados duráveis do proprietário do agente selecionado e nenhum identificador aberto no processo do doctor.
Os modos destrutivos `import`, `compact`, `recover` e `restore`
mantêm o mesmo bloqueio de propriedade do estado usado na inicialização do Gateway durante toda a operação;
`inspect`, `dry-run` e `validate` permanecem somente leitura e não o adquirem. Interrompa
o Gateway primeiro. Os modos destrutivos falham em vez de disputar com gravações ativas ou
com outro comando de manutenção. Um destino destrutivo `--session-sqlite-store`
deve estar dentro do diretório de estado ativo; defina `OPENCLAW_STATE_DIR` como
o diretório de estado proprietário do armazenamento antes de realizar a manutenção de outra instalação.
Destinos existentes vinculados por hard link são rejeitados porque outro caminho pode compartilhar o
mesmo inode do banco de dados fora do diretório de estado bloqueado. As mesmas verificações de propriedade
abrangem os arquivos auxiliares WAL, de memória compartilhada e de journal de reversão do SQLite.

Cada importação grava um manifesto em
`~/.openclaw/session-sqlite-migration-runs/` antes de mover os artefatos de transcrições
para o arquivo. Se a inicialização relatar uma falha na migração do SQLite de sessões após
os artefatos terem sido movidos, execute a recuperação:

```bash
openclaw doctor --session-sqlite recover --github-issue
```

A recuperação seleciona o manifesto de migração com falha mais recente, restaura apenas os
artefatos arquivados do manifesto, valida os destinos afetados, atualiza os
relatórios sanitizados `.failure.md` e `.failure.json` e prepara o corpo de um problema do GitHub
que evita conteúdos de transcrições, ambiente bruto, segredos e configurações sem limites.
Quando não há um manifesto de migração com falha, mas um banco de dados SQLite de um agente selecionado
está corrompido, não é um banco de dados ou possui arquivos auxiliares de journal sem um banco de dados
principal, a recuperação copia o conjunto completo de arquivos para um diretório temporário de inspeção.
O SQLite pode reverter um journal ativo válido nessa cópia descartável
antes da execução de `quick_check`, `integrity_check` e `foreign_key_check`, enquanto os
arquivos forenses originais permanecem intactos. Verificações de integridade com falha ou arquivos auxiliares
órfãos preservam os arquivos DB, WAL, SHM e de journal de reversão renomeando
todo o conjunto descoberto com um sufixo `.corrupt-<timestamp>`. Uma falha de renomeação
capturada reverte os arquivos já movidos antes de relatar a falha, para que um
conjunto recuperável de arquivos não seja dividido silenciosamente. Interrompa o Gateway antes da recuperação;
copiar ou renomear um conjunto de arquivos SQLite em alteração ativa não é seguro e se comporta
de maneira diferente entre sistemas operacionais. Com `--github-issue --yes`, o doctor usa
a CLI do GitHub para criar o problema em `openclaw/openclaw`; sem confirmação,
ele grava o relatório de suporte local e imprime uma URL de problema preenchida previamente.

`restore` continua sendo a operação de desfazer de nível inferior. Ela usa registros
`sourcePath -> archivePath` do manifesto, move os artefatos arquivados de volta somente quando o
caminho original está ausente, relata conflitos quando ambos os caminhos existem e mantém
o banco de dados SQLite no lugar.

### Downgrade após a migração do SQLite de sessões

Antes de iniciar uma versão mais antiga do OpenClaw baseada em arquivos, restaure os
artefatos legados de transcrições arquivados:

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Versões anteriores liam as entradas `sessions.json` e os caminhos `sessionFile` registrados
nessas entradas. Após a migração para SQLite, as importações bem-sucedidas movem as transcrições JSONL
ativas para `session-sqlite-import-archive/`, portanto o runtime anterior não consegue
ver esse histórico até que a restauração mova esses artefatos registrados no manifesto de volta para
seus caminhos originais.

A restauração não exclui dados do SQLite. As sessões criadas após a mudança para SQLite
existem apenas no SQLite e não aparecerão no runtime anterior. Se posteriormente
você fizer a atualização novamente, execute a sequência normal de validação da migração acima para que o OpenClaw possa
comparar os artefatos legados restaurados com as linhas do SQLite antes da importação.

## Observações

- No modo Nix (`OPENCLAW_NIX_MODE=1`), as verificações somente leitura do doctor continuam funcionando, mas `doctor --fix`, `doctor --repair`, `doctor --yes` e `doctor --generate-gateway-token` ficam desativados porque `openclaw.json` é imutável. Em vez disso, edite a fonte Nix desta instalação; para nix-openclaw, use o [Início rápido](https://github.com/openclaw/nix-openclaw#quick-start) com o agente como primeira opção.
- Os prompts interativos (correções de chaveiro/OAuth etc.) são executados somente quando stdin é um TTY e `--non-interactive` **não** está definido. Execuções headless (cron, Telegram, sem terminal) ignoram os prompts.
- As execuções não interativas de `doctor` ignoram o carregamento antecipado de plugins para manter rápidas as verificações de integridade headless. As sessões interativas ainda carregam as superfícies de plugin necessárias para o fluxo legado de integridade/reparo.
- `--lint` é mais rigoroso que `--non-interactive`: é sempre somente leitura, nunca exibe prompts e nunca aplica migrações seguras. Use `doctor --fix` ou `doctor --repair` quando quiser que o doctor faça alterações.
- Por padrão, o doctor não executa SecretRefs `exec` ao verificar segredos. Use `--allow-exec` (com ou sem `--lint`) somente quando quiser intencionalmente que o doctor execute esses resolvedores de segredos configurados.
- Qualquer gravação de configuração (incluindo um reparo `--fix`) rotaciona um backup para `~/.openclaw/openclaw.json.bak` (com um anel numerado de `.bak.1` a `.bak.4`). `--fix` também remove chaves de configuração desconhecidas relatadas pela validação do esquema, listando cada remoção; essa etapa é ignorada enquanto uma atualização está em andamento, para que o estado da atualização parcialmente gravado não seja removido antes da conclusão da migração.
- Defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando outro supervisor for responsável pelo ciclo de vida do Gateway. O doctor ainda relata a integridade do Gateway/serviço e aplica reparos não relacionados ao serviço, mas ignora a instalação/inicialização/reinicialização/preparação do serviço e a limpeza de serviços legados.
- No Linux, o doctor ignora unidades systemd adicionais inativas semelhantes ao Gateway e não regrava os metadados de comando/ponto de entrada de um serviço Gateway do systemd em execução durante o reparo. Primeiro interrompa o serviço ou use `openclaw gateway install --force` para substituir o inicializador ativo.
- `doctor --fix --non-interactive` relata definições de serviço do Gateway ausentes ou obsoletas, mas não as instala nem regrava fora do modo de reparo de atualização. Execute `openclaw gateway install` para um serviço ausente ou `openclaw gateway install --force` para substituir o inicializador.
- As verificações de integridade do estado detectam arquivos de transcrição órfãos no diretório de sessões. Arquivá-los como `.deleted.<timestamp>` exige confirmação interativa; `--fix`, `--yes` e as execuções headless os mantêm no lugar.
- O doctor verifica `~/.openclaw/cron/jobs.json` (ou `cron.store`) em busca de formatos legados de tarefas cron e os regrava antes de importar linhas canônicas para o SQLite.
- O doctor relata tarefas cron com uma substituição explícita de `payload.model`, incluindo contagens por namespace do provedor e divergências em relação a `agents.defaults.model`, para que tarefas agendadas que não herdam o modelo padrão fiquem visíveis durante investigações de autenticação ou faturamento.
- O doctor relata tarefas cron ainda marcadas como em andamento (`state.runningAtMs`), o que pode fazer com que `openclaw cron list` as mostre como `running`. Essa verificação é somente leitura: se nenhum Gateway estiver executando uma tarefa marcada no momento, a próxima inicialização do serviço cron registrará a execução interrompida e removerá o marcador.
- No Linux, o doctor avisa quando o crontab do usuário ainda executa o `~/.openclaw/bin/ensure-whatsapp.sh` legado e sem manutenção, que pode relatar `Gateway inactive` incorretamente quando o cron não tem o ambiente do barramento de usuário do systemd.
- Quando o WhatsApp está habilitado, o doctor verifica se há um loop de eventos degradado do Gateway com clientes `openclaw-tui` locais ainda em execução. `doctor --fix` interrompe somente clientes TUI locais verificados, para que as respostas do WhatsApp não fiquem na fila atrás de loops obsoletos de atualização da TUI.
- O doctor regrava referências de modelo legadas `codex/*` e `openai-codex/*` como referências canônicas `openai/*` em modelos principais, alternativas, listas de modelos permitidos, modelos de geração de imagens/vídeos, substituições de heartbeat/subagente/compaction, hooks, substituições de modelo por canal, cargas úteis de cron e fixações obsoletas de rota de sessão/transcrição. `--fix` também mescla configurações legadas `models.providers.codex` e `models.providers.openai-codex` quando for seguro, migra perfis de autenticação `openai-codex:*` legados e entradas `auth.order.openai-codex` para `openai:*`, transfere a intenção do Codex para entradas `agentRuntime.id: "codex"` com escopo de provedor/modelo, remove fixações obsoletas de runtime para o agente inteiro/sessão e mantém as referências reparadas de agentes OpenAI no roteamento de autenticação do Codex, em vez da autenticação direta por chave de API da OpenAI.
- O doctor relata listas `auth.order.<provider>` não vazias cujos perfis referenciados já não existem, enquanto há credenciais armazenadas compatíveis. `doctor --fix` exclui somente essas substituições obsoletas, restaurando a seleção automática de credenciais por agente; ordens explicitamente vazias, listas parcialmente válidas e ordens sem uma credencial armazenada compatível permanecem inalteradas. Se um armazenamento ativo de autenticação do SQLite estiver ilegível ou malformado, o doctor explicará por que ignorou esse reparo. Reinicie um Gateway em execução antes de verificar novamente o status da autenticação caso o modo de recarregamento da configuração não aplique a gravação automaticamente.
- O doctor limpa o estado legado de preparação de dependências de plugins de versões anteriores do OpenClaw e revincula o pacote `openclaw` do host para plugins npm gerenciados que o declaram como dependência par. Ele também repara plugins baixáveis ausentes referenciados pela configuração (`plugins.entries`, canais configurados, configurações de provedor/pesquisa configuradas e runtimes de agente configurados). Durante atualizações de pacotes, o doctor ignora o reparo de plugins pelo gerenciador de pacotes até a conclusão da substituição do pacote; execute `openclaw doctor --fix` novamente depois disso caso um plugin configurado ainda precise de recuperação. Se um download falhar, o doctor relatará o erro de instalação e preservará a entrada do plugin configurado para a próxima tentativa de reparo.
- O doctor repara configurações obsoletas de plugins removendo IDs de plugins ausentes de `plugins.allow`/`plugins.deny`/`plugins.entries`, além das configurações de canal pendentes correspondentes, alvos de heartbeat e substituições de modelo por canal, quando a descoberta de plugins está íntegra.
- O doctor coloca configurações inválidas de plugins em quarentena desabilitando a entrada `plugins.entries.<id>` afetada e removendo sua carga útil `config` inválida. A inicialização do Gateway já ignora somente esse plugin inválido, portanto os demais plugins e canais continuam funcionando.
- O doctor remove o `plugins.entries.codex.config.codexDynamicToolsProfile` descontinuado; o servidor de aplicativos do Codex sempre mantém nativas as ferramentas de espaço de trabalho próprias do Codex.
- O doctor migra automaticamente a configuração Talk plana legada (`talk.voiceId`, `talk.modelId` e outras) para `talk.provider` + `talk.providers.<provider>`. Execuções repetidas de `doctor --fix` não relatam/aplicam mais a normalização do Talk quando a única diferença é a ordem das chaves do objeto.
- O doctor inclui uma verificação de prontidão da pesquisa de memória e pode recomendar `openclaw configure --section model` quando faltarem credenciais de embeddings.
- O doctor avisa quando nenhum proprietário de comandos está configurado. O proprietário de comandos é a conta do operador humano autorizada a executar comandos exclusivos do proprietário e aprovar ações perigosas. O pareamento por DM permite apenas que alguém converse com o bot; se você aprovou um remetente antes da existência da preparação do primeiro proprietário, defina `commands.ownerAllowFrom` explicitamente.
- O doctor relata uma observação informativa quando agentes no modo Codex estão configurados e há recursos pessoais da CLI do Codex no diretório inicial do Codex do operador. Inicializações locais do servidor de aplicativos do Codex usam diretórios iniciais isolados por agente; primeiro instale o plugin do Codex, se necessário, e depois use `openclaw migrate plan codex` para inventariar os recursos que devem ser promovidos deliberadamente.
- O doctor avisa quando Skills permitidas para o agente padrão não estão disponíveis no ambiente de runtime atual (binários, variáveis de ambiente ou configurações ausentes, ou requisitos de SO não atendidos). `doctor --fix` pode desabilitar essas Skills indisponíveis com `skills.entries.<skill>.enabled=false`; se quiser manter a Skill ativa, instale/configure o requisito ausente.
- Se o modo sandbox estiver habilitado, mas o Docker não estiver disponível, o doctor relatará um aviso claro com as medidas corretivas (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Se houver arquivos legados do registro do sandbox ou diretórios de fragmentos (`~/.openclaw/sandbox/containers.json`, `~/.openclaw/sandbox/browsers.json`, `~/.openclaw/sandbox/containers/` ou `~/.openclaw/sandbox/browsers/`), o doctor os relatará; `--fix` migra entradas válidas para o SQLite e coloca arquivos legados inválidos em quarentena.
- Se `gateway.auth.token`/`gateway.auth.password` forem gerenciados por SecretRef e estiverem indisponíveis no caminho do comando atual, o doctor relatará um aviso somente leitura e não gravará credenciais alternativas em texto simples. Para SecretRefs baseadas em execução, o doctor ignora a execução, a menos que `--allow-exec` esteja presente.
- Se a inspeção de SecretRefs de canais falhar em um caminho de correção, o doctor continuará e relatará um aviso em vez de encerrar antecipadamente.
- Após as migrações do diretório de estado, o doctor avisa quando as contas padrão habilitadas do Telegram ou Discord dependem de uma alternativa por variável de ambiente e `TELEGRAM_BOT_TOKEN` ou `DISCORD_BOT_TOKEN` não está disponível para o processo do doctor.
- A resolução automática do nome de usuário `allowFrom` do Telegram (`doctor --fix`) exige um token do Telegram que possa ser resolvido no caminho do comando atual. Se a inspeção do token não estiver disponível, o doctor relatará um aviso e ignorará a resolução automática nessa execução.

## macOS: substituições de ambiente de `launchctl`

Se você executou anteriormente `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (ou `...PASSWORD`), esse valor substitui o arquivo de configuração e pode causar erros persistentes de "não autorizado".

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Doctor do Gateway](/pt-BR/gateway/doctor)
