---
read_when:
    - Executando scripts a partir do repositório
    - Adição ou alteração de scripts em ./scripts
summary: 'Scripts do repositório: finalidade, escopo e observações de segurança'
title: Scripts
x-i18n:
    generated_at: "2026-07-11T23:59:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 323069190ea6647101ee7120e06f6b2a018833d0904a11787fa1b610f5b3d9e1
    source_path: help/scripts.md
    workflow: 16
---

`scripts/` contém scripts auxiliares para fluxos de trabalho locais e tarefas operacionais. Use-os quando uma tarefa estiver claramente vinculada a um script; caso contrário, prefira a CLI.

## Convenções

- Os scripts são **opcionais**, a menos que sejam mencionados na documentação ou nas listas de verificação de lançamento.
- Prefira as interfaces da CLI quando existirem (exemplo: `openclaw models status --check`).
- Pressuponha que os scripts sejam específicos do host; leia-os antes de executá-los em uma nova máquina.

## Scripts de monitoramento de autenticação

A autenticação geral de modelos é abordada em [Autenticação](/pt-BR/gateway/authentication). Os scripts abaixo constituem um sistema separado e opcional para monitorar um **token de assinatura da CLI do Claude Code** em um host remoto/sem interface gráfica e refazer a autenticação por um telefone:

- `scripts/setup-auth-system.sh` - configuração única: verifica a autenticação atual, ajuda a gerar um `claude setup-token` de longa duração e exibe as etapas de instalação no systemd/Termux.
- `scripts/claude-auth-status.sh [full|json|simple]` - verifica o status de autenticação do Claude Code e do OpenClaw.
- `scripts/auth-monitor.sh` - consulta o status periodicamente e envia uma notificação (pelo envio do OpenClaw e/ou pelo ntfy.sh) quando o token está próximo de expirar. Variáveis de ambiente: `WARN_HOURS` (padrão: `2`), `NOTIFY_PHONE`, `NOTIFY_NTFY`. Execute-o de forma agendada por meio dos arquivos incluídos `scripts/systemd/openclaw-auth-monitor.{service,timer}` (a cada 30 minutos).
- `scripts/mobile-reauth.sh` - executa novamente `claude setup-token` e exibe URLs para abrir em um telefone, para uso por SSH pelo Termux.
- `scripts/termux-quick-auth.sh`, `scripts/termux-auth-widget.sh`, `scripts/termux-sync-widget.sh` - scripts do Termux:Widget que se conectam ao host por SSH, exibem uma notificação breve de status e abrem o console/as instruções de reautenticação quando a autenticação expira.

## Auxiliar de leitura do GitHub

Use `scripts/gh-read` quando quiser que o `gh` use um token de instalação de um GitHub App para chamadas de leitura limitadas ao repositório, mantendo o `gh` normal conectado à sua conta pessoal para ações de escrita.

Variáveis de ambiente obrigatórias:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

Variáveis de ambiente opcionais:

- `OPENCLAW_GH_READ_INSTALLATION_ID` quando quiser ignorar a busca da instalação com base no repositório
- `OPENCLAW_GH_READ_PERMISSIONS` como uma substituição separada por vírgulas para o subconjunto de permissões de leitura a solicitar

Ordem de resolução do repositório:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

Exemplos:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## Ao adicionar scripts

- Mantenha os scripts específicos e documentados.
- Adicione uma breve entrada na documentação relevante (ou crie uma, caso não exista).

## Relacionados

- [Testes](/pt-BR/help/testing)
- [Testes em ambiente real](/pt-BR/help/testing-live)
