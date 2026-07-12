---
read_when:
    - Depuração da autenticação do modelo ou da expiração do OAuth
    - Documentando o armazenamento de autenticação ou credenciais
summary: 'Autenticação de modelos: OAuth, chaves de API, reutilização da CLI do Claude e token de configuração da Anthropic'
title: Autenticação
x-i18n:
    generated_at: "2026-07-12T15:08:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 002877002323297f0ff24fdeb5283bf998215f902b0cbd3b152f7ba9085a852a
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Esta página aborda a autenticação de **provedores de modelos** (chaves de API, OAuth, reutilização da CLI do Claude, token de configuração da Anthropic). Para autenticação de **conexão com o Gateway** (token, senha, proxy confiável), consulte [Configuração](/pt-BR/gateway/configuration) e [Autenticação por proxy confiável](/pt-BR/gateway/trusted-proxy-auth).
</Note>

O OpenClaw oferece suporte a OAuth e chaves de API para provedores de modelos. Para um host do Gateway sempre ativo, uma chave de API é a opção mais previsível; fluxos de assinatura/OAuth também funcionam quando correspondem ao modelo de conta do seu provedor.

- Fluxo OAuth completo e layout de armazenamento: [/concepts/oauth](/pt-BR/concepts/oauth)
- Autenticação baseada em SecretRef (provedores `env`/`file`/`exec`): [Gerenciamento de segredos](/pt-BR/gateway/secrets)
- Códigos de elegibilidade/motivo das credenciais usados por `models status --probe`: [Semântica das credenciais de autenticação](/pt-BR/auth-credential-semantics)

## Configuração recomendada: chave de API (qualquer provedor)

1. Crie uma chave de API no console do seu provedor.
2. Coloque-a no **host do Gateway** (a máquina que executa `openclaw gateway`):

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Se o Gateway for executado pelo systemd/launchd, coloque a chave em `~/.openclaw/.env` para que o daemon possa lê-la:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

4. Reinicie o processo do Gateway (ou o daemon) e verifique novamente:

```bash
openclaw models status
openclaw doctor
```

`openclaw onboard` também pode armazenar chaves de API para uso pelo daemon se você não quiser gerenciar variáveis de ambiente por conta própria. Consulte [Variáveis de ambiente](/pt-BR/help/environment) para ver a precedência completa de carregamento do ambiente (`env.shellEnv`, `~/.openclaw/.env`, systemd/launchd).

## Anthropic: reutilização da CLI do Claude

A autenticação por token de configuração da Anthropic continua sendo um caminho compatível. A reutilização da CLI do Claude (uso no estilo `claude -p`) também é aprovada para esta integração; quando houver um login da CLI do Claude disponível no host, esse será o caminho preferencial para uso local/em desktop. Para hosts do Gateway de longa duração, uma chave de API da Anthropic ainda é a opção mais previsível, com controle explícito de cobrança no lado do servidor.

Configuração do host para reutilização da CLI do Claude:

```bash
# Execute no host do Gateway
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Isso é feito em duas etapas: faça login do Claude Code na Anthropic no host e, em seguida, instrua o OpenClaw a encaminhar a seleção de modelos da Anthropic pelo backend local `claude-cli` e armazenar o perfil de autenticação correspondente do OpenClaw.

Se `claude` não estiver no `PATH`, instale o Claude Code ou defina `agents.defaults.cliBackends.claude-cli.command` como o caminho do binário.

## Inserção manual de token

Funciona para qualquer provedor; grava no armazenamento SQLite de autenticação por agente e atualiza a configuração:

```bash
openclaw models auth paste-token --provider openrouter
```

O OpenClaw lê os perfis de autenticação do `openclaw-agent.sqlite` de cada agente. Detalhes do endpoint (`baseUrl`, `api`, IDs de modelos, cabeçalhos, tempos limite) devem ficar em `models.providers.<id>` no `openclaw.json` ou `models.json`, não nos perfis de autenticação.

Se uma instalação mais antiga ainda tiver `auth-profiles.json`, `auth-state.json` ou uma estrutura simples como `{ "openrouter": { "apiKey": "..." } }`, execute `openclaw doctor --fix` para importá-la para o SQLite; o doctor mantém backups com carimbo de data e hora ao lado dos arquivos JSON originais.

Rotas de autenticação externas, como `auth: "aws-sdk"` do Bedrock, não são credenciais. Para uma rota nomeada do Bedrock, defina `auth.profiles.<id>.mode: "aws-sdk"` no `openclaw.json` — não grave `type: "aws-sdk"` no armazenamento de perfis de autenticação. `openclaw doctor --fix` migra marcadores legados do AWS SDK do armazenamento de credenciais para os metadados de configuração.

### Credenciais baseadas em SecretRef

- Credenciais `api_key` podem usar `keyRef: { source, provider, id }`
- Credenciais `token` podem usar `tokenRef: { source, provider, id }`
- Perfis no modo OAuth rejeitam credenciais SecretRef: se `auth.profiles.<id>.mode` for `"oauth"`, um `keyRef`/`tokenRef` baseado em SecretRef para esse perfil será rejeitado.

## Verificação do status da autenticação dos modelos

```bash
openclaw models status
openclaw doctor
```

Verificação adequada para automação, com saída `1` quando estiver expirado/ausente e `2` quando estiver prestes a expirar:

```bash
openclaw models status --check
```

Sondagens de autenticação em tempo real (adicione `--probe-provider`, `--probe-profile`, `--probe-timeout`, `--probe-concurrency` ou `--probe-max-tokens` para restringir o escopo):

```bash
openclaw models status --probe
```

Observações:

- As linhas da sondagem podem vir de perfis de autenticação, credenciais do ambiente ou `models.json`.
- Se `auth.order.<provider>` omitir um perfil armazenado, a sondagem informará `excluded_by_auth_order` para esse perfil em vez de testá-lo.
- Se houver autenticação, mas o OpenClaw não conseguir resolver um modelo que possa ser sondado para esse provedor, a sondagem informará `status: no_model`.
- Períodos de espera por limite de taxa podem ser específicos ao modelo: um perfil em período de espera para um modelo ainda pode atender a outro modelo do mesmo provedor.

Scripts operacionais opcionais (systemd/Termux): [Scripts de monitoramento de autenticação](/pt-BR/help/scripts#auth-monitoring-scripts).

## Rotação de chaves de API (Gateway)

Alguns provedores repetem uma solicitação com uma chave alternativa configurada quando uma chamada atinge um limite de taxa do provedor.

Ordem de prioridade das chaves por provedor:

1. `OPENCLAW_LIVE_<PROVIDER>_KEY` (substituição única, fixa uma chave)
2. `<PROVIDER>_API_KEYS` (lista separada por vírgulas/espaços/pontos e vírgulas)
3. `<PROVIDER>_API_KEY`
4. `<PROVIDER>_API_KEY_*` (qualquer variável de ambiente com este prefixo)

Os provedores do Google (`google`, `google-vertex`) também recorrem a `GOOGLE_API_KEY`. A lista combinada é desduplicada antes do uso.

O OpenClaw passa para a próxima chave somente quando a mensagem de erro corresponde a: `rate_limit`, `rate limit`, `429`, `quota exceeded`/`quota_exceeded`, `resource exhausted`/`resource_exhausted` ou `too many requests`. Outros erros não são repetidos com chaves alternativas. Se todas as chaves falharem, será retornado o erro final da última tentativa.

<Note>
Expressões específicas de provedores, como `ThrottlingException`, `concurrency limit reached` ou `workers_ai ... quota limit exceeded`, determinam a **classificação de failover/nova tentativa** (alternância entre modelos ou provedores após falhas repetidas), um mecanismo separado da rotação de chaves de API descrita acima.
</Note>

Remover a autenticação salva não revoga a chave no provedor — faça a rotação ou revogue-a no painel do provedor quando precisar invalidá-la no lado do provedor.

## Remoção da autenticação do provedor enquanto o Gateway está em execução

Quando você remove a autenticação de um provedor pelo plano de controle do Gateway, o OpenClaw exclui os perfis de autenticação salvos desse provedor e interrompe execuções ativas de chats/agentes cujo provedor do modelo selecionado corresponda ao removido. As execuções interrompidas emitem os eventos normais de cancelamento/ciclo de vida com `stopReason: "auth-revoked"`, permitindo que os clientes conectados mostrem que a execução foi interrompida porque as credenciais foram removidas.

## Controle da credencial utilizada

### OpenAI e IDs legados `openai-codex`

Os perfis de chave de API da OpenAI e os perfis OAuth do ChatGPT/Codex usam o ID de provedor canônico `openai`. Use IDs de perfil `openai:*` e `auth.order.openai` em novas configurações.

Se você encontrar `openai-codex` em configurações antigas, IDs de perfis de autenticação ou `auth.order.openai-codex`, trate-o como entrada de migração legada — não crie novos perfis `openai-codex`. Execute:

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

O doctor reescreve IDs de perfil legados `openai-codex:*` e entradas `auth.order.openai-codex` para a rota canônica `openai`. Para o roteamento de modelos/runtime específico da OpenAI, consulte [OpenAI](/pt-BR/providers/openai).

### Durante o login (CLI)

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

`--profile-id` mantém separados vários logins OAuth do mesmo provedor dentro de um agente.

`--force` exclui os perfis de autenticação salvos desse provedor no diretório do agente selecionado e, em seguida, executa novamente o mesmo fluxo de autenticação. Use-o quando um perfil salvo estiver travado, expirado ou vinculado à conta errada. Ele não revoga as credenciais no provedor.

```bash
openclaw models auth login --provider anthropic --force
```

### Por sessão (comando de chat)

- `/model <alias-or-id>@<profileId>` fixa uma credencial específica do provedor para a sessão atual (exemplos de IDs de perfil: `anthropic:default`, `anthropic:work`).
- `/model` (ou `/model list`) mostra um seletor compacto; `/model status` mostra a visualização completa (candidatos + próximo perfil de autenticação, além dos detalhes do endpoint do provedor quando configurados).

Se você alterar a ordem de autenticação ou a fixação do perfil de um chat que já esteja em execução, envie `/new` ou `/reset` para iniciar uma nova sessão — as sessões existentes mantêm a seleção atual de modelo/perfil até serem redefinidas.

### Por agente (substituição via CLI)

As substituições da ordem de autenticação são armazenadas no estado de autenticação SQLite desse agente:

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Use `--agent <id>` para selecionar um agente específico; omita-o para usar o agente padrão configurado. `openclaw models status --probe` mostra perfis armazenados omitidos como `excluded_by_auth_order` em vez de ignorá-los silenciosamente.

## Solução de problemas

### "Nenhuma credencial encontrada"

Configure uma chave de API da Anthropic no **host do Gateway** ou configure o caminho do token de configuração da Anthropic e verifique novamente:

```bash
openclaw models status
```

### Token prestes a expirar/expirado

Execute `openclaw models status` para identificar qual perfil está prestes a expirar. Se um perfil de token da Anthropic estiver ausente ou expirado, atualize-o pelo token de configuração ou migre para uma chave de API da Anthropic.

## Relacionados

- [Gerenciamento de segredos](/pt-BR/gateway/secrets)
- [Acesso remoto](/pt-BR/gateway/remote)
- [Armazenamento de autenticação](/pt-BR/concepts/oauth)
