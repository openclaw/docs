---
read_when:
    - Você quer um passo a passo amigável para iniciantes da TUI
    - Você precisa da lista completa de recursos, comandos e atalhos da TUI
summary: 'Interface de terminal (TUI): conectar ao Gateway ou executar localmente em modo embutido'
title: TUI
x-i18n:
    generated_at: "2026-04-24T06:20:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6168ab6cec8e0069f660ddcfca03275c407b613b6eb756aa6ef7e97f2312effe
    source_path: web/tui.md
    workflow: 15
---

## Início rápido

### Modo Gateway

1. Inicie o Gateway.

```bash
openclaw gateway
```

2. Abra a TUI.

```bash
openclaw tui
```

3. Digite uma mensagem e pressione Enter.

Gateway remoto:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Use `--password` se seu Gateway usar autenticação por senha.

### Modo local

Execute a TUI sem um Gateway:

```bash
openclaw chat
# ou
openclaw tui --local
```

Observações:

- `openclaw chat` e `openclaw terminal` são aliases para `openclaw tui --local`.
- `--local` não pode ser combinado com `--url`, `--token` ou `--password`.
- O modo local usa diretamente o runtime embutido do agente. A maioria das ferramentas locais funciona, mas recursos exclusivos do Gateway não ficam disponíveis.

## O que você vê

- Cabeçalho: URL de conexão, agente atual, sessão atual.
- Log do chat: mensagens do usuário, respostas do assistente, avisos do sistema, cards de ferramentas.
- Linha de status: estado da conexão/execução (conectando, em execução, streaming, ocioso, erro).
- Rodapé: estado da conexão + agente + sessão + modelo + think/fast/verbose/trace/reasoning + contagem de tokens + deliver.
- Entrada: editor de texto com autocomplete.

## Modelo mental: agentes + sessões

- Agentes são slugs únicos (por exemplo, `main`, `research`). O Gateway expõe a lista.
- Sessões pertencem ao agente atual.
- Chaves de sessão são armazenadas como `agent:<agentId>:<sessionKey>`.
  - Se você digitar `/session main`, a TUI expande para `agent:<currentAgent>:main`.
  - Se você digitar `/session agent:other:main`, você muda explicitamente para a sessão daquele agente.
- Escopo da sessão:
  - `per-sender` (padrão): cada agente tem muitas sessões.
  - `global`: a TUI sempre usa a sessão `global` (o seletor pode estar vazio).
- O agente + sessão atuais ficam sempre visíveis no rodapé.

## Envio + entrega

- As mensagens são enviadas ao Gateway; a entrega aos provedores fica desativada por padrão.
- Ative a entrega:
  - `/deliver on`
  - ou no painel Settings
  - ou inicie com `openclaw tui --deliver`

## Seletores + overlays

- Seletor de modelo: lista modelos disponíveis e define a sobrescrita da sessão.
- Seletor de agente: escolha um agente diferente.
- Seletor de sessão: mostra apenas sessões do agente atual.
- Settings: alterna deliver, expansão da saída da ferramenta e visibilidade de thinking.

## Atalhos de teclado

- Enter: enviar mensagem
- Esc: abortar execução ativa
- Ctrl+C: limpar entrada (pressione duas vezes para sair)
- Ctrl+D: sair
- Ctrl+L: seletor de modelo
- Ctrl+G: seletor de agente
- Ctrl+P: seletor de sessão
- Ctrl+O: alternar expansão da saída da ferramenta
- Ctrl+T: alternar visibilidade de thinking (recarrega o histórico)

## Comandos slash

Principais:

- `/help`
- `/status`
- `/agent <id>` (ou `/agents`)
- `/session <key>` (ou `/sessions`)
- `/model <provider/model>` (ou `/models`)

Controles de sessão:

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>` (alias: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

Ciclo de vida da sessão:

- `/new` ou `/reset` (redefine a sessão)
- `/abort` (aborta a execução ativa)
- `/settings`
- `/exit`

Somente modo local:

- `/auth [provider]` abre o fluxo de autenticação/login do provedor dentro da TUI.

Outros comandos slash do Gateway (por exemplo, `/context`) são encaminhados ao Gateway e mostrados como saída do sistema. Consulte [Comandos slash](/pt-BR/tools/slash-commands).

## Comandos de shell locais

- Prefixe uma linha com `!` para executar um comando de shell local no host da TUI.
- A TUI solicita uma vez por sessão para permitir execução local; se você recusar, `!` permanece desativado para a sessão.
- Os comandos são executados em um shell novo, não interativo, no diretório de trabalho da TUI (sem `cd`/env persistente).
- Comandos de shell locais recebem `OPENCLAW_SHELL=tui-local` no ambiente.
- Um `!` sozinho é enviado como mensagem normal; espaços à esquerda não acionam exec local.

## Reparar configurações a partir da TUI local

Use o modo local quando a configuração atual já for válida e você quiser que o
agente embutido a inspecione na mesma máquina, compare com a documentação
e ajude a reparar desvios sem depender de um Gateway em execução.

Se `openclaw config validate` já estiver falhando, comece com `openclaw configure`
ou `openclaw doctor --fix` primeiro. `openclaw chat` não contorna a proteção
contra configuração inválida.

Loop típico:

1. Inicie o modo local:

```bash
openclaw chat
```

2. Peça ao agente o que você quer verificar, por exemplo:

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. Use comandos de shell locais para evidência exata e validação:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Aplique alterações pontuais com `openclaw config set` ou `openclaw configure`, depois execute novamente `!openclaw config validate`.
5. Se o Doctor recomendar uma migração ou reparo automático, revise e execute `!openclaw doctor --fix`.

Dicas:

- Prefira `openclaw config set` ou `openclaw configure` em vez de editar manualmente `openclaw.json`.
- `openclaw docs "<query>"` pesquisa o índice de documentação ao vivo na mesma máquina.
- `openclaw config validate --json` é útil quando você quer erros estruturados de schema e de SecretRef/resolvabilidade.

## Saída da ferramenta

- Chamadas de ferramenta são mostradas como cards com args + resultados.
- Ctrl+O alterna entre visões recolhida/expandida.
- Enquanto as ferramentas são executadas, atualizações parciais são transmitidas para o mesmo card.

## Cores do terminal

- A TUI mantém o texto do corpo do assistente na cor padrão de primeiro plano do seu terminal para que terminais escuros e claros permaneçam legíveis.
- Se seu terminal usa fundo claro e a autodetecção estiver errada, defina `OPENCLAW_THEME=light` antes de iniciar `openclaw tui`.
- Para forçar a paleta escura original, defina `OPENCLAW_THEME=dark`.

## Histórico + streaming

- Ao conectar, a TUI carrega o histórico mais recente (padrão de 200 mensagens).
- Respostas em streaming são atualizadas no lugar até serem finalizadas.
- A TUI também escuta eventos de ferramenta do agente para cards de ferramenta mais ricos.

## Detalhes da conexão

- A TUI se registra no Gateway como `mode: "tui"`.
- Reconexões mostram uma mensagem de sistema; lacunas de eventos aparecem no log.

## Opções

- `--local`: executa no runtime local embutido do agente
- `--url <url>`: URL WebSocket do Gateway (usa por padrão a configuração ou `ws://127.0.0.1:<port>`)
- `--token <token>`: token do Gateway (se necessário)
- `--password <password>`: senha do Gateway (se necessária)
- `--session <key>`: chave da sessão (padrão: `main`, ou `global` quando o escopo é global)
- `--deliver`: entrega respostas do assistente ao provedor (padrão desativado)
- `--thinking <level>`: sobrescreve o nível de thinking para envios
- `--message <text>`: envia uma mensagem inicial após conectar
- `--timeout-ms <ms>`: timeout do agente em ms (usa por padrão `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: entradas do histórico a carregar (padrão `200`)

Observação: quando você define `--url`, a TUI não usa fallback para credenciais da configuração ou do ambiente.
Passe `--token` ou `--password` explicitamente. A ausência de credenciais explícitas é um erro.
No modo local, não passe `--url`, `--token` ou `--password`.

## Solução de problemas

Sem saída após enviar uma mensagem:

- Execute `/status` na TUI para confirmar se o Gateway está conectado e ocioso/ocupado.
- Verifique os logs do Gateway: `openclaw logs --follow`.
- Confirme que o agente pode executar: `openclaw status` e `openclaw models status`.
- Se você espera mensagens em um canal de chat, ative a entrega (`/deliver on` ou `--deliver`).

## Solução de problemas de conexão

- `disconnected`: verifique se o Gateway está em execução e se `--url/--token/--password` estão corretos.
- Nenhum agente no seletor: verifique `openclaw agents list` e sua configuração de roteamento.
- Seletor de sessão vazio: você pode estar em escopo global ou ainda não ter sessões.

## Relacionado

- [Control UI](/pt-BR/web/control-ui) — interface de controle baseada na web
- [Configuração](/pt-BR/cli/config) — inspecionar, validar e editar `openclaw.json`
- [Doctor](/pt-BR/cli/doctor) — verificações guiadas de reparo e migração
- [Referência da CLI](/pt-BR/cli) — referência completa de comandos da CLI
