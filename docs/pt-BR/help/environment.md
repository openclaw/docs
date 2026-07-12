---
read_when:
    - Você precisa saber quais variáveis de ambiente são carregadas e em que ordem
    - Você está depurando chaves de API ausentes no Gateway
    - Você está documentando ambientes de autenticação ou implantação de provedores
summary: Onde o OpenClaw carrega as variáveis de ambiente e a ordem de precedência
title: Variáveis de ambiente
x-i18n:
    generated_at: "2026-07-12T15:18:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e0010465008969ea1ebf7bb79d01ee86b7be20f7b6d0d90da72d8b0a3b1ed273
    source_path: help/environment.md
    workflow: 16
---

OpenClaw carrega variáveis de ambiente de várias fontes. A regra é **nunca substituir valores existentes**.
Arquivos `.env` do workspace são uma fonte de menor confiança: o OpenClaw ignora credenciais de provedores e controles protegidos de runtime provenientes do `.env` do workspace antes de aplicar a precedência.

## Precedência (da mais alta para a mais baixa)

1. **Ambiente do processo** (o que o processo do Gateway já recebeu do shell/daemon pai).
2. **`.env` no diretório de trabalho atual** (padrão do dotenv; não substitui; credenciais de provedores e controles protegidos de runtime são ignorados).
3. **`.env` global** em `~/.openclaw/.env` (também conhecido como `$OPENCLAW_STATE_DIR/.env`; recomendado para chaves de API de provedores; não substitui).
4. **Bloco `env` da configuração** em `~/.openclaw/openclaw.json` (aplicado somente se estiver ausente).
5. **Importação opcional do shell de login** (`env.shellEnv.enabled` ou `OPENCLAW_LOAD_SHELL_ENV=1`), aplicada somente às chaves esperadas que estiverem ausentes.

Em instalações novas do Ubuntu que usam o diretório de estado padrão, o OpenClaw também trata `~/.config/openclaw/gateway.env` como fallback de compatibilidade após o `.env` global. Se ambos os arquivos existirem e tiverem valores divergentes, o OpenClaw mantém `~/.openclaw/.env` e exibe um aviso.

Se o arquivo de configuração estiver totalmente ausente, a etapa 4 será ignorada; a importação do shell ainda será executada se estiver habilitada.

## Credenciais de provedores e `.env` do workspace

Não mantenha chaves de API de provedores somente em um `.env` do workspace. O OpenClaw bloqueia um grande conjunto de chaves de credenciais de provedores e de redirecionamento de endpoints provenientes de arquivos `.env` do workspace, incluindo todas as variáveis de ambiente de autenticação de provedores conhecidas (por exemplo, `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY`, `FIRECRAWL_API_KEY`), além de qualquer chave terminada em `_API_HOST`, `_BASE_URL` ou `_HOMESERVER`, e todos os namespaces `OPENCLAW_*`, `CLAWHUB_*`, `ANTHROPIC_API_KEY_*` e `OPENAI_API_KEY_*`.

Em vez disso, use uma destas fontes confiáveis para as credenciais de provedores:

- O ambiente do processo do Gateway, como um shell, uma unidade launchd/systemd, um segredo de contêiner ou um segredo de CI.
- O arquivo dotenv global do runtime em `~/.openclaw/.env` ou `$OPENCLAW_STATE_DIR/.env`.
- O bloco `env` da configuração em `~/.openclaw/openclaw.json`.
- A importação opcional do shell de login quando `env.shellEnv.enabled` ou `OPENCLAW_LOAD_SHELL_ENV=1` estiver habilitado.

Se você armazenava anteriormente chaves de provedores somente em um `.env` do workspace, mova-as para uma das fontes confiáveis acima. O `.env` do workspace ainda pode fornecer variáveis comuns do projeto que não sejam credenciais, redirecionamentos de endpoints, substituições de host ou controles de runtime `OPENCLAW_*`.

Consulte [Arquivos `.env` do workspace](/pt-BR/gateway/security#workspace-env-files) para conhecer a justificativa de segurança.

## Bloco `env` da configuração

Há duas maneiras equivalentes de definir variáveis de ambiente inline (nenhuma delas substitui valores existentes):

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

O bloco `env` da configuração aceita somente valores de string literais. Ele não expande
valores `file:...`; por exemplo, `XAI_API_KEY: "file:secrets/xai-api-key.txt"`
é repassado aos provedores exatamente como essa string.

Para chaves de provedores baseadas em arquivo, use uma SecretRef no campo de credencial que
oferece suporte a ela:

```json5
{
  secrets: {
    providers: {
      xai_key_file: {
        source: "file",
        path: "~/.openclaw/secrets/xai-api-key.txt",
        mode: "singleValue",
      },
    },
  },
  models: {
    providers: {
      xai: {
        apiKey: { source: "file", provider: "xai_key_file", id: "value" },
      },
    },
  },
}
```

Consulte [Gerenciamento de segredos](/pt-BR/gateway/secrets) e a
[superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface) para conhecer
os campos compatíveis.

## Importação do ambiente do shell

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

Variáveis de ambiente equivalentes:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000` (padrão `15000`)

## Snapshots do shell de execução

Em hosts do Gateway que não são Windows, os comandos `exec` do bash e zsh usam um snapshot de inicialização por padrão.
Defina `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` no ambiente do processo do Gateway para desabilitar esse caminho.
Os valores `false`, `no` e `off` também o desabilitam. Os valores `exec.env` de cada chamada não podem alternar
os snapshots nem redirecionar o cache de snapshots.

## Variáveis de ambiente injetadas pelo runtime

O OpenClaw também injeta marcadores de contexto nos processos filhos iniciados:

- `OPENCLAW_SHELL=exec`: definido para comandos executados por meio da ferramenta `exec`.
- `OPENCLAW_SHELL=acp-client`: definido para `openclaw acp client` quando ele inicia o processo de ponte ACP.
- `OPENCLAW_SHELL=tui-local`: definido para comandos de shell `!` locais da TUI.
- `OPENCLAW_CLI=1`: definido para processos filhos iniciados pelo ponto de entrada da CLI.

Esses são marcadores de runtime (não são configurações obrigatórias do usuário). Eles podem ser usados na lógica do shell/perfil
para aplicar regras específicas ao contexto.

## Variáveis de ambiente da interface

- `OPENCLAW_THEME=light`: força a paleta clara da TUI quando o terminal tem fundo claro.
- `OPENCLAW_THEME=dark`: força a paleta escura da TUI.
- `COLORFGBG`: se o terminal exportar essa variável, o OpenClaw usará a indicação da cor de fundo para escolher automaticamente a paleta da TUI.

## Substituição de variáveis de ambiente na configuração

Você pode referenciar variáveis de ambiente diretamente nos valores de string da configuração usando a sintaxe `${VAR_NAME}`:

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

Consulte [Configuração: substituição de variáveis de ambiente](/pt-BR/gateway/configuration-reference#env-var-substitution) para obter todos os detalhes.

## Referências de segredos versus strings `${ENV}`

O OpenClaw oferece suporte a dois padrões baseados no ambiente:

- Substituição de strings `${VAR}` nos valores da configuração.
- Objetos SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) para campos compatíveis com referências de segredos.

Ambos são resolvidos a partir do ambiente do processo no momento da ativação. Os detalhes de SecretRef estão documentados em [Gerenciamento de segredos](/pt-BR/gateway/secrets).
O próprio bloco `env` da configuração não resolve SecretRefs nem valores abreviados
`file:...`.

## Variáveis de ambiente relacionadas a caminhos

| Variável                 | Finalidade                                                                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_HOME`          | Substitui o diretório inicial usado para os padrões de caminhos internos do OpenClaw (`~/.openclaw/`, diretórios de agentes, sessões, credenciais, integração inicial do instalador e o checkout de desenvolvimento padrão). Útil ao executar o OpenClaw como um usuário de serviço dedicado. |
| `OPENCLAW_STATE_DIR`     | Substitui o diretório de estado (padrão `~/.openclaw`).                                                                                                                                                                                     |
| `OPENCLAW_CONFIG_PATH`   | Substitui o caminho do arquivo de configuração (padrão `~/.openclaw/openclaw.json`).                                                                                                                                                        |
| `OPENCLAW_INCLUDE_ROOTS` | Lista de caminhos de diretórios nos quais as diretivas `$include` podem resolver arquivos fora do diretório de configuração (padrão: nenhum — `$include` fica restrito ao diretório de configuração). O til é expandido.                     |

## Registro em log

| Variável                         | Finalidade                                                                                                                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | Substitui o nível de log tanto para arquivo quanto para console (por exemplo, `debug`, `trace`). Tem precedência sobre `logging.level` e `logging.consoleLevel` na configuração. Valores inválidos são ignorados com um aviso. |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | Emite diagnósticos específicos de temporização de solicitações/respostas do modelo no nível `info` sem habilitar logs globais de depuração.                                                                    |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | Diagnósticos do payload do modelo: `summary`, `tools` ou `full-redacted`. `full-redacted` tem limite de tamanho e é expurgado, mas pode incluir texto de prompts/mensagens.                                     |
| `OPENCLAW_DEBUG_SSE`             | Diagnósticos de streaming: `events` para a temporização do primeiro evento e da conclusão, `peek` para incluir os cinco primeiros eventos SSE expurgados.                                                     |
| `OPENCLAW_DEBUG_CODE_MODE`       | Diagnósticos da superfície do modelo no modo de código, incluindo a ocultação de ferramentas do provedor e a aplicação direta/compacta de controles.                                                          |

### `OPENCLAW_HOME`

Quando definido, `OPENCLAW_HOME` substitui o diretório inicial do sistema (`$HOME` / `os.homedir()`) nos padrões de caminhos internos do OpenClaw. Isso inclui o diretório de estado padrão, o caminho da configuração, os diretórios de agentes, as credenciais, o workspace de integração inicial do instalador e o checkout de desenvolvimento padrão usado por `openclaw update --channel dev`.

**Precedência:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > fallback do diretório inicial do `PREFIX` do Termux no Android > `os.homedir()`

**Exemplo** (LaunchDaemon do macOS):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` também pode ser definido como um caminho com til (por exemplo, `~/svc`), que é expandido antes do uso por meio da mesma cadeia de fallback do diretório inicial do sistema operacional.

Variáveis de caminho explícitas, como `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH` e `OPENCLAW_GIT_DIR`, ainda têm precedência. Tarefas da conta do sistema operacional, como detecção de arquivos de inicialização do shell, configuração do gerenciador de pacotes e expansão de `~` no host, ainda podem usar o diretório inicial real do sistema.

## Usuários do nvm: falhas de TLS no web_fetch

Se o Node.js tiver sido instalado por meio do **nvm** (e não pelo gerenciador de pacotes do sistema), o `fetch()` integrado usará
o repositório de ACs incluído no nvm, que pode não conter ACs raiz modernas (ISRG Root X1/X2 para Let's Encrypt,
DigiCert Global Root G2 etc.). Isso faz com que `web_fetch` falhe com `"fetch failed"` na maioria dos sites HTTPS.

No Linux, o OpenClaw detecta o nvm automaticamente e aplica a correção no ambiente real de inicialização:

- `openclaw gateway install` grava `NODE_EXTRA_CA_CERTS` no ambiente do serviço systemd
- o ponto de entrada da CLI `openclaw` executa novamente a si próprio com `NODE_EXTRA_CA_CERTS` definido antes da inicialização do Node

**Correção manual (para versões mais antigas ou execuções diretas de `node ...`):**

Exporte a variável antes de iniciar o OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Não dependa de gravar essa variável somente em `~/.openclaw/.env`; o Node lê
`NODE_EXTRA_CA_CERTS` na inicialização do processo.

## Variáveis de ambiente legadas

O OpenClaw lê somente variáveis de ambiente `OPENCLAW_*`. Os prefixos legados
`CLAWDBOT_*` e `MOLTBOT_*` de versões anteriores são silenciosamente
ignorados.

Se alguma delas ainda estiver definida no processo do Gateway durante a inicialização, o OpenClaw emitirá um
único aviso de descontinuação do Node (`OPENCLAW_LEGACY_ENV_VARS`) que lista os
prefixos detectados e a contagem total. Renomeie cada valor substituindo o
prefixo legado por `OPENCLAW_` (por exemplo, `CLAWDBOT_GATEWAY_TOKEN` por
`OPENCLAW_GATEWAY_TOKEN`); os nomes antigos não têm efeito.

## Relacionados

- [Configuração do Gateway](/pt-BR/gateway/configuration)
- [Perguntas frequentes: variáveis de ambiente e carregamento de .env](/pt-BR/help/faq#env-vars-and-env-loading)
- [Visão geral dos modelos](/pt-BR/concepts/models)
