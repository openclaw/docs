---
read_when:
    - Você precisa saber quais variáveis de ambiente são carregadas e em que ordem
    - Você está depurando chaves de API ausentes no Gateway
    - Você está documentando autenticação de provedores ou ambientes de implantação
summary: De onde o OpenClaw carrega variáveis de ambiente e a ordem de precedência
title: Variáveis de ambiente
x-i18n:
    generated_at: "2026-04-30T09:52:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: d19b9053207a088b3eb39d03e36fc2d415295feb80da51bd71339884466b101b
    source_path: help/environment.md
    workflow: 16
---

OpenClaw carrega variáveis de ambiente de várias fontes. A regra é **nunca substituir valores existentes**.

## Precedência (mais alta → mais baixa)

1. **Ambiente do processo** (o que o processo do Gateway já tem do shell/daemon pai).
2. **`.env` no diretório de trabalho atual** (padrão do dotenv; não substitui).
3. **`.env` global** em `~/.openclaw/.env` (também conhecido como `$OPENCLAW_STATE_DIR/.env`; não substitui).
4. **Bloco `env` de configuração** em `~/.openclaw/openclaw.json` (aplicado somente se estiver ausente).
5. **Importação opcional do shell de login** (`env.shellEnv.enabled` ou `OPENCLAW_LOAD_SHELL_ENV=1`), aplicada somente para chaves esperadas ausentes.

Em novas instalações do Ubuntu que usam o diretório de estado padrão, o OpenClaw também trata `~/.config/openclaw/gateway.env` como um fallback de compatibilidade após o `.env` global. Se os dois arquivos existirem e divergirem, o OpenClaw mantém `~/.openclaw/.env` e imprime um aviso.

Se o arquivo de configuração estiver totalmente ausente, a etapa 4 será ignorada; a importação do shell ainda será executada se estiver habilitada.

## Bloco `env` de configuração

Duas formas equivalentes de definir variáveis de ambiente embutidas (ambas sem substituição):

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
  },
}
```

## Importação de ambiente do shell

`env.shellEnv` executa seu shell de login e importa somente as chaves esperadas **ausentes**:

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

Equivalentes em variáveis de ambiente:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Variáveis de ambiente injetadas em runtime

O OpenClaw também injeta marcadores de contexto em processos filhos gerados:

- `OPENCLAW_SHELL=exec`: definido para comandos executados por meio da ferramenta `exec`.
- `OPENCLAW_SHELL=acp`: definido para gerações de processos de backend de runtime ACP (por exemplo, `acpx`).
- `OPENCLAW_SHELL=acp-client`: definido para `openclaw acp client` quando ele gera o processo de ponte ACP.
- `OPENCLAW_SHELL=tui-local`: definido para comandos de shell `!` da TUI local.

Estes são marcadores de runtime (não são configuração obrigatória do usuário). Eles podem ser usados na lógica de shell/perfil
para aplicar regras específicas de contexto.

## Variáveis de ambiente da UI

- `OPENCLAW_THEME=light`: força a paleta clara da TUI quando seu terminal tem um fundo claro.
- `OPENCLAW_THEME=dark`: força a paleta escura da TUI.
- `COLORFGBG`: se seu terminal a exportar, o OpenClaw usará a dica de cor de fundo para escolher automaticamente a paleta da TUI.

## Substituição de variáveis de ambiente na configuração

Você pode referenciar variáveis de ambiente diretamente em valores de string da configuração usando a sintaxe `${VAR_NAME}`:

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
}
```

Consulte [Configuração: substituição de variáveis de ambiente](/pt-BR/gateway/configuration-reference#env-var-substitution) para detalhes completos.

## Referências de segredo versus strings `${ENV}`

O OpenClaw oferece suporte a dois padrões orientados por ambiente:

- Substituição de strings `${VAR}` em valores de configuração.
- Objetos SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) para campos compatíveis com referências de segredos.

Ambos são resolvidos a partir do ambiente do processo no momento da ativação. Os detalhes de SecretRef estão documentados em [Gerenciamento de segredos](/pt-BR/gateway/secrets).

## Variáveis de ambiente relacionadas a caminhos

| Variável               | Finalidade                                                                                                                                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`        | Substitui o diretório inicial usado para toda resolução interna de caminhos (`~/.openclaw/`, diretórios de agentes, sessões, credenciais). Útil ao executar o OpenClaw como usuário de serviço dedicado. |
| `OPENCLAW_STATE_DIR`   | Substitui o diretório de estado (padrão `~/.openclaw`).                                                                                                                                         |
| `OPENCLAW_CONFIG_PATH` | Substitui o caminho do arquivo de configuração (padrão `~/.openclaw/openclaw.json`).                                                                                                           |

## Registro em log

| Variável             | Finalidade                                                                                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_LOG_LEVEL` | Substitui o nível de log tanto para arquivo quanto para console (por exemplo, `debug`, `trace`). Tem precedência sobre `logging.level` e `logging.consoleLevel` na configuração. Valores inválidos são ignorados com um aviso. |

### `OPENCLAW_HOME`

Quando definido, `OPENCLAW_HOME` substitui o diretório inicial do sistema (`$HOME` / `os.homedir()`) para toda resolução interna de caminhos. Isso permite isolamento completo do sistema de arquivos para contas de serviço sem interface.

**Precedência:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Exemplo** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` também pode ser definido como um caminho com til (por exemplo, `~/svc`), que é expandido usando `$HOME` antes do uso.

## Usuários do nvm: falhas de TLS no web_fetch

Se o Node.js foi instalado via **nvm** (não pelo gerenciador de pacotes do sistema), o `fetch()` integrado usa
o armazenamento de CAs empacotado do nvm, que pode não conter CAs raiz modernas (ISRG Root X1/X2 para Let's Encrypt,
DigiCert Global Root G2 etc.). Isso faz com que `web_fetch` falhe com `"fetch failed"` na maioria dos sites HTTPS.

No Linux, o OpenClaw detecta automaticamente o nvm e aplica a correção no ambiente real de inicialização:

- `openclaw gateway install` grava `NODE_EXTRA_CA_CERTS` no ambiente do serviço systemd
- o ponto de entrada da CLI `openclaw` reexecuta a si mesmo com `NODE_EXTRA_CA_CERTS` definido antes da inicialização do Node

**Correção manual (para versões mais antigas ou inicializações diretas com `node ...`):**

Exporte a variável antes de iniciar o OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Não dependa de gravar essa variável somente em `~/.openclaw/.env`; o Node lê
`NODE_EXTRA_CA_CERTS` na inicialização do processo.

## Variáveis de ambiente legadas

O OpenClaw lê apenas variáveis de ambiente `OPENCLAW_*`. Os prefixos legados
`CLAWDBOT_*` e `MOLTBOT_*` de versões anteriores são ignorados silenciosamente.

Se alguma delas ainda estiver definida no processo do Gateway na inicialização, o OpenClaw emite um
único aviso de descontinuação do Node (`OPENCLAW_LEGACY_ENV_VARS`) listando os
prefixos detectados e a contagem total. Renomeie cada valor substituindo o
prefixo legado por `OPENCLAW_` (por exemplo, `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`); os nomes antigos não têm efeito.

## Relacionados

- [Configuração do Gateway](/pt-BR/gateway/configuration)
- [FAQ: variáveis de ambiente e carregamento de .env](/pt-BR/help/faq#env-vars-and-env-loading)
- [Visão geral de modelos](/pt-BR/concepts/models)
