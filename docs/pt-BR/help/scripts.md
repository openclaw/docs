---
read_when:
    - Executando scripts a partir do repositório
    - Adicionando ou alterando scripts em ./scripts
summary: 'Scripts do repositório: finalidade, escopo e observações de segurança'
title: Scripts
x-i18n:
    generated_at: "2026-05-06T05:58:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01f2e064891940959acf23c003d7e842386f67ac6c869d0677b802738ac04bdf
    source_path: help/scripts.md
    workflow: 16
---

O diretório `scripts/` contém scripts auxiliares para fluxos de trabalho locais e tarefas de operações.
Use-os quando uma tarefa estiver claramente vinculada a um script; caso contrário, prefira a CLI.

## Convenções

- Scripts são **opcionais**, a menos que sejam referenciados na documentação ou em checklists de release.
- Prefira superfícies da CLI quando existirem (exemplo: o monitoramento de autenticação usa `openclaw models status --check`).
- Presuma que scripts são específicos do host; leia-os antes de executá-los em uma nova máquina.

## Scripts de monitoramento de autenticação

O monitoramento de autenticação é abordado em [Autenticação](/pt-BR/gateway/authentication). Os scripts em `scripts/` são extras opcionais para fluxos de trabalho de telefones com systemd/Termux.

## Auxiliar de leitura do GitHub

Use `scripts/gh-read` quando quiser que `gh` use um token de instalação de GitHub App para chamadas de leitura com escopo de repositório, deixando o `gh` normal no seu login pessoal para ações de escrita.

Env obrigatório:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

Env opcional:

- `OPENCLAW_GH_READ_INSTALLATION_ID` quando quiser pular a busca de instalação baseada em repositório
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

- Mantenha os scripts focados e documentados.
- Adicione uma entrada curta na documentação relevante (ou crie uma se estiver ausente).

## Relacionado

- [Testes](/pt-BR/help/testing)
- [Testes ao vivo](/pt-BR/help/testing-live)
