---
read_when:
    - Implementando recursos do app para macOS
    - Alterando o ciclo de vida do gateway ou a ponte de nós no macOS
summary: Aplicativo complementar do OpenClaw para macOS (barra de menus + broker do gateway)
title: app macOS
x-i18n:
    generated_at: "2026-06-27T17:43:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e637a1ae5ca66dfb6255fb6a233436ae0cf04b972f96446e8dc3d703486c9fa
    source_path: platforms/macos.md
    workflow: 16
---

O app para macOS é o **companheiro da barra de menus** do OpenClaw. Ele controla permissões,
gerencia/anexa-se ao Gateway localmente (launchd ou manual) e expõe recursos do macOS
ao agente como um nó.

## O que ele faz

- Mostra notificações nativas e status na barra de menus.
- Controla prompts de TCC (Notificações, Acessibilidade, Gravação de Tela, Microfone,
  Reconhecimento de Fala, Automação/AppleScript).
- Executa ou conecta-se ao Gateway (local ou remoto).
- Expõe ferramentas exclusivas do macOS (Canvas, Câmera, Gravação de Tela, `system.run`).
- Inicia o serviço host de nó local no modo **remoto** (launchd) e o interrompe no modo **local**.
- Opcionalmente hospeda **PeekabooBridge** para automação de UI.
- Instala a CLI global (`openclaw`) sob solicitação via npm, pnpm ou bun (o app prefere npm, depois pnpm, depois bun; Node continua sendo o runtime recomendado para o Gateway).

## Modo local vs remoto

- **Local** (padrão): o app anexa-se a um Gateway local em execução, se houver;
  caso contrário, ele habilita o serviço launchd via `openclaw gateway install`.
- **Remoto**: o app conecta-se a um Gateway por SSH/Tailscale e nunca inicia
  um processo local.
  O app inicia o **serviço host de nó** local para que o Gateway remoto possa alcançar este Mac.
  O app não inicia o Gateway como um processo filho.
  A descoberta do Gateway agora prefere nomes Tailscale MagicDNS em vez de IPs brutos da tailnet,
  então o app para Mac se recupera com mais confiabilidade quando os IPs da tailnet mudam.

## Controle do launchd

O app gerencia um LaunchAgent por usuário rotulado `ai.openclaw.gateway`
(ou `ai.openclaw.<profile>` ao usar `--profile`/`OPENCLAW_PROFILE`; o legado `com.openclaw.*` ainda é descarregado).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Substitua o rótulo por `ai.openclaw.<profile>` ao executar um perfil nomeado.

Se o LaunchAgent não estiver instalado, habilite-o pelo app ou execute
`openclaw gateway install`.

Se o gateway desaparecer repetidamente por minutos a horas e só retomar quando você toca na Control UI ou entra no host por SSH, consulte a nota de solução de problemas para Suspensão de Manutenção do macOS / falhas `ENETDOWN` e a trava de proteção de respawn do launchd em [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#macos-gateway-silently-stops-responding-then-resumes-when-you-touch-the-dashboard).

## Recursos do nó (Mac)

O app para macOS apresenta-se como um nó. Comandos comuns:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Câmera: `camera.snap`, `camera.clip`
- Tela: `screen.snapshot`, `screen.record`
- Sistema: `system.run`, `system.notify`

O nó relata um mapa `permissions` para que os agentes possam decidir o que é permitido.

Serviço de nó + IPC do app:

- Quando o serviço host de nó headless está em execução (modo remoto), ele se conecta ao Gateway WS como um nó.
- `system.run` executa no app para macOS (contexto de UI/TCC) por um socket Unix local; prompts + saída permanecem no app.

Diagrama (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Aprovações de execução (system.run)

`system.run` é controlado por **Aprovações de execução** no app para macOS (Configurações → Aprovações de execução).
Segurança + solicitação + allowlist são armazenadas localmente no Mac em:

```
~/.openclaw/exec-approvals.json
```

Exemplo:

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [{ "pattern": "/opt/homebrew/bin/rg" }]
    }
  }
}
```

Notas:

- Entradas de `allowlist` são padrões glob para caminhos binários resolvidos ou nomes de comando simples para comandos invocados via PATH.
- Texto bruto de comando shell que contém sintaxe de controle ou expansão de shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) é tratado como uma ausência na allowlist e exige aprovação explícita (ou adicionar o binário do shell à allowlist).
- Escolher "Sempre permitir" no prompt adiciona esse comando à allowlist.
- Sobrescritas de ambiente de `system.run` são filtradas (remove `PATH`, `DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`) e então mescladas com o ambiente do app.
- Para wrappers de shell (`bash|sh|zsh ... -c/-lc`), sobrescritas de ambiente com escopo de solicitação são reduzidas a uma pequena allowlist explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Para decisões de permitir sempre no modo allowlist, wrappers de despacho conhecidos (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) persistem caminhos de executáveis internos em vez de caminhos dos wrappers. Se o desempacotamento não for seguro, nenhuma entrada de allowlist é persistida automaticamente.

## Links profundos

O app registra o esquema de URL `openclaw://` para ações locais.

### `openclaw://agent`

Aciona uma solicitação `agent` do Gateway.
__OC_I18N_900004__
Parâmetros de consulta:

- `message` (obrigatório)
- `sessionKey` (opcional)
- `thinking` (opcional)
- `deliver` / `to` / `channel` (opcional)
- `timeoutSeconds` (opcional)
- `key` (chave opcional de modo desacompanhado)

Segurança:

- Sem `key`, o app solicita confirmação.
- Sem `key`, o app aplica um limite curto de mensagem para o prompt de confirmação e ignora `deliver` / `to` / `channel`.
- Com uma `key` válida, a execução é desacompanhada (destinada a automações pessoais).

## Fluxo de integração (típico)

1. Instale e abra **OpenClaw.app**.
2. Conclua a lista de permissões (prompts de TCC).
3. Garanta que o modo **Local** esteja ativo e que o Gateway esteja em execução.
4. Instale a CLI se quiser acesso pelo terminal.

## Posicionamento do diretório de estado (macOS)

Evite colocar seu diretório de estado do OpenClaw no iCloud ou em outras pastas sincronizadas com a nuvem.
Caminhos com sincronização podem adicionar latência e ocasionalmente causar corridas de bloqueio/sincronização de arquivos para
sessões e credenciais.

Prefira um caminho de estado local não sincronizado, como:
__OC_I18N_900005__
Se `openclaw doctor` detectar estado em:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

ele emitirá um aviso e recomendará voltar para um caminho local.

## Fluxo de build e desenvolvimento (nativo)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (ou Xcode)
- Empacotar app: `scripts/package-mac-app.sh`

## Depurar conectividade do gateway (CLI do macOS)

Use a CLI de depuração para exercitar o mesmo handshake de WebSocket do Gateway e a lógica de descoberta
que o app para macOS usa, sem iniciar o app.
__OC_I18N_900006__
Opções de conexão:

- `--url <ws://host:port>`: sobrescrever configuração
- `--mode <local|remote>`: resolver a partir da configuração (padrão: configuração ou local)
- `--probe`: forçar uma nova sondagem de saúde
- `--timeout <ms>`: tempo limite da solicitação (padrão: `15000`)
- `--json`: saída estruturada para comparação

Opções de descoberta:

- `--include-local`: incluir gateways que seriam filtrados como "local"
- `--timeout <ms>`: janela geral de descoberta (padrão: `2000`)
- `--json`: saída estruturada para comparação

<Tip>
Compare com `openclaw gateway discover --json` para ver se o pipeline de descoberta do app para macOS (`local.` mais o domínio de longa distância configurado, com fallbacks de longa distância e Tailscale Serve) difere da descoberta baseada em `dns-sd` da CLI Node.
</Tip>

## Encanamento de conexão remota (túneis SSH)

Quando o app para macOS é executado no modo **Remoto**, ele abre um túnel SSH para que componentes de UI locais
possam falar com um Gateway remoto como se ele estivesse em localhost.

### Túnel de controle (porta WebSocket do Gateway)

- **Finalidade:** verificações de saúde, status, Web Chat, configuração e outras chamadas do plano de controle.
- **Porta local:** a porta do Gateway (padrão `18789`), sempre estável.
- **Porta remota:** a mesma porta do Gateway no host remoto.
- **Comportamento:** nenhuma porta local aleatória; o app reutiliza um túnel saudável existente
  ou o reinicia, se necessário.
- **Formato SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` com BatchMode +
  ExitOnForwardFailure + opções de keepalive.
- **Relato de IP:** o túnel SSH usa loopback, então o gateway verá o IP do nó
  como `127.0.0.1`. Use o transporte **Direto (ws/wss)** se quiser que o IP real do cliente
  apareça (consulte [acesso remoto do macOS](/pt-BR/platforms/mac/remote)).

Para etapas de configuração, consulte [acesso remoto do macOS](/pt-BR/platforms/mac/remote). Para detalhes do protocolo,
consulte [protocolo do Gateway](/pt-BR/gateway/protocol).

## Documentos relacionados

- [Runbook do Gateway](/pt-BR/gateway)
- [Gateway (macOS)](/pt-BR/platforms/mac/bundled-gateway)
- [Permissões do macOS](/pt-BR/platforms/mac/permissions)
- [Canvas](/pt-BR/platforms/mac/canvas)
