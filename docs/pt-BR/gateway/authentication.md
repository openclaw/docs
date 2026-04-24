---
read_when:
    - Depurando autenticação de modelo ou expiração do OAuth
    - Documentando autenticação ou armazenamento de credenciais
summary: 'Autenticação de modelo: OAuth, chaves de API, reutilização do Claude CLI e setup-token do Anthropic'
title: Autenticação
x-i18n:
    generated_at: "2026-04-24T05:50:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 371aa5a66bcec5c0271c6b7dcb0fcbb05a075f61ffd2c67616b6ea3a48f54934
    source_path: gateway/authentication.md
    workflow: 15
---

# Autenticação (provedores de modelo)

<Note>
Esta página cobre a autenticação de **provedor de modelo** (chaves de API, OAuth, reutilização do Claude CLI e setup-token do Anthropic). Para autenticação de **conexão do gateway** (token, senha, trusted-proxy), consulte [Configuration](/pt-BR/gateway/configuration) e [Trusted Proxy Auth](/pt-BR/gateway/trusted-proxy-auth).
</Note>

O OpenClaw oferece suporte a OAuth e chaves de API para provedores de modelo. Para hosts de gateway sempre ativos, chaves de API normalmente são a opção mais previsível. Fluxos de assinatura/OAuth também são compatíveis quando correspondem ao modelo de conta do seu provedor.

Consulte [/concepts/oauth](/pt-BR/concepts/oauth) para ver o fluxo completo de OAuth e o layout de armazenamento.
Para autenticação baseada em SecretRef (provedores `env`/`file`/`exec`), consulte [Gerenciamento de segredos](/pt-BR/gateway/secrets).
Para as regras de elegibilidade/códigos de motivo de credenciais usadas por `models status --probe`, consulte
[Semântica de credenciais de autenticação](/pt-BR/auth-credential-semantics).

## Configuração recomendada (chave de API, qualquer provedor)

Se você estiver executando um gateway de longa duração, comece com uma chave de API para o provedor escolhido.
Para o Anthropic especificamente, a autenticação por chave de API continua sendo a configuração de servidor mais previsível, mas o OpenClaw também oferece suporte à reutilização de um login local do Claude CLI.

1. Crie uma chave de API no console do seu provedor.
2. Coloque-a no **host do gateway** (a máquina que executa `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Se o Gateway for executado sob systemd/launchd, prefira colocar a chave em
   `~/.openclaw/.env` para que o daemon possa lê-la:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Em seguida, reinicie o daemon (ou reinicie o processo do seu Gateway) e verifique novamente:

```bash
openclaw models status
openclaw doctor
```

Se você preferir não gerenciar variáveis de ambiente por conta própria, o onboarding pode armazenar
chaves de API para uso pelo daemon: `openclaw onboard`.

Consulte [Ajuda](/pt-BR/help) para detalhes sobre herança de env (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: Claude CLI e compatibilidade de token

A autenticação por setup-token do Anthropic continua disponível no OpenClaw como um caminho de token compatível. Desde então, a equipe do Anthropic nos informou que o uso do Claude CLI no estilo OpenClaw é permitido novamente, então o OpenClaw trata a reutilização do Claude CLI e o uso de `claude -p` como autorizados para essa integração, a menos que o Anthropic publique uma nova política. Quando a reutilização do Claude CLI está disponível no host, esse agora é o caminho preferido.

Para hosts de gateway de longa duração, uma chave de API do Anthropic continua sendo a configuração mais previsível. Se você quiser reutilizar um login existente do Claude no mesmo host, use o caminho do Anthropic Claude CLI no onboarding/configure.

Configuração recomendada do host para reutilização do Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Esta é uma configuração em duas etapas:

1. Fazer login do próprio Claude Code no Anthropic no host do gateway.
2. Dizer ao OpenClaw para alternar a seleção de modelo do Anthropic para o backend local `claude-cli` e armazenar o perfil de autenticação correspondente do OpenClaw.

Se `claude` não estiver em `PATH`, instale primeiro o Claude Code ou defina
`agents.defaults.cliBackends.claude-cli.command` como o caminho real do binário.

Entrada manual de token (qualquer provedor; grava `auth-profiles.json` + atualiza a configuração):

```bash
openclaw models auth paste-token --provider openrouter
```

Refs de perfil de autenticação também são compatíveis com credenciais estáticas:

- credenciais `api_key` podem usar `keyRef: { source, provider, id }`
- credenciais `token` podem usar `tokenRef: { source, provider, id }`
- perfis em modo OAuth não oferecem suporte a credenciais SecretRef; se `auth.profiles.<id>.mode` estiver definido como `"oauth"`, entrada `keyRef`/`tokenRef` respaldada por SecretRef para esse perfil será rejeitada.

Verificação compatível com automação (sai com `1` quando expirado/ausente, `2` quando está para expirar):

```bash
openclaw models status --check
```

Probes de autenticação ativas:

```bash
openclaw models status --probe
```

Observações:

- Linhas de probe podem vir de perfis de autenticação, credenciais de env ou `models.json`.
- Se `auth.order.<provider>` explícito omitir um perfil armazenado, a probe reportará
  `excluded_by_auth_order` para esse perfil em vez de tentá-lo.
- Se a autenticação existir, mas o OpenClaw não conseguir resolver um candidato de modelo verificável para
  esse provedor, a probe reportará `status: no_model`.
- Cooldowns de limite de taxa podem ter escopo por modelo. Um perfil em cooldown para um
  modelo ainda pode ser utilizável para um modelo irmão no mesmo provedor.

Scripts operacionais opcionais (systemd/Termux) estão documentados aqui:
[Scripts de monitoramento de autenticação](/pt-BR/help/scripts#auth-monitoring-scripts)

## Observação sobre Anthropic

O backend `claude-cli` do Anthropic voltou a ser compatível.

- A equipe do Anthropic nos informou que esse caminho de integração do OpenClaw voltou a ser permitido.
- Portanto, o OpenClaw trata a reutilização do Claude CLI e o uso de `claude -p` como autorizados
  para execuções com Anthropic, a menos que o Anthropic publique uma nova política.
- Chaves de API do Anthropic continuam sendo a escolha mais previsível para hosts de gateway
  de longa duração e para controle explícito de cobrança no lado do servidor.

## Verificando o status de autenticação do modelo

```bash
openclaw models status
openclaw doctor
```

## Comportamento de rotação de chave de API (gateway)

Alguns provedores oferecem suporte a repetir uma solicitação com chaves alternativas quando uma chamada de API
atinge um limite de taxa do provedor.

- Ordem de prioridade:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (substituição única)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Provedores Google também incluem `GOOGLE_API_KEY` como fallback adicional.
- A mesma lista de chaves é deduplicada antes do uso.
- O OpenClaw repete com a próxima chave apenas para erros de limite de taxa (por exemplo
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` ou
  `workers_ai ... quota limit exceeded`).
- Erros que não são de limite de taxa não são repetidos com chaves alternativas.
- Se todas as chaves falharem, o erro final da última tentativa será retornado.

## Controlando qual credencial é usada

### Por sessão (comando de chat)

Use `/model <alias-or-id>@<profileId>` para fixar uma credencial específica de provedor para a sessão atual (exemplo de IDs de perfil: `anthropic:default`, `anthropic:work`).

Use `/model` (ou `/model list`) para um seletor compacto; use `/model status` para a visualização completa (candidatos + próximo perfil de autenticação, além de detalhes de endpoint do provedor quando configurados).

### Por agente (substituição de CLI)

Defina uma substituição explícita da ordem de perfis de autenticação para um agente (armazenada em `auth-state.json` desse agente):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Use `--agent <id>` para direcionar um agente específico; omita para usar o agente padrão configurado.
Ao depurar problemas de ordem, `openclaw models status --probe` mostra perfis
armazenados omitidos como `excluded_by_auth_order` em vez de ignorá-los silenciosamente.
Ao depurar problemas de cooldown, lembre-se de que cooldowns de limite de taxa podem estar vinculados
a um ID de modelo, e não ao perfil inteiro do provedor.

## Solução de problemas

### "No credentials found"

Se o perfil do Anthropic estiver ausente, configure uma chave de API do Anthropic no
**host do gateway** ou configure o caminho de setup-token do Anthropic, depois verifique novamente:

```bash
openclaw models status
```

### Token expirando/expirado

Execute `openclaw models status` para confirmar qual perfil está expirando. Se um
perfil de token do Anthropic estiver ausente ou expirado, atualize essa configuração via
setup-token ou migre para uma chave de API do Anthropic.

## Relacionado

- [Gerenciamento de segredos](/pt-BR/gateway/secrets)
- [Acesso remoto](/pt-BR/gateway/remote)
- [Armazenamento de autenticação](/pt-BR/concepts/oauth)
