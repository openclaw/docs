---
read_when:
    - Comandos da CLI do ClawHub ou do registro do OpenClaw falham
    - Um pacote não pode ser instalado, publicado ou atualizado
summary: Solução de problemas de login, instalação, publicação, atualização e API do ClawHub.
x-i18n:
    generated_at: "2026-06-28T22:32:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Solução de problemas

## `clawhub login` abre um navegador, mas nunca conclui

A CLI inicia um servidor local de retorno de chamada de curta duração durante o login pelo navegador.

- Verifique se seu navegador consegue acessar `http://127.0.0.1:<port>/callback`.
- Verifique as regras de firewall local, VPN e proxy se o retorno de chamada nunca chegar.
- Em ambientes sem interface gráfica, crie um token de API na interface web do ClawHub e execute:

```bash
clawhub login --token clh_...
```

## `whoami` ou `publish` retorna `Unauthorized` (401)

- Entre novamente com `clawhub login`.
- Se você usa um caminho de configuração personalizado, confirme se `CLAWHUB_CONFIG_PATH` aponta para o
  arquivo que contém seu token atual.
- Se você usa um token de API, confirme se ele não foi revogado na interface web.

## A pesquisa ou instalação retorna `Rate limit exceeded` (429)

Leia as informações de nova tentativa na resposta:

- `Retry-After`: segundos a esperar antes de tentar novamente.
- `RateLimit-Limit`: o limite aplicado a esta solicitação.
- `RateLimit-Remaining`: seu orçamento restante exato quando o cabeçalho está presente. Em `429`, ele é `0`.
- `RateLimit-Reset` ou `X-RateLimit-Reset`: tempo de redefinição.

Se muitos usuários compartilham um único IP de saída, limites de IP anônimo podem ser atingidos mesmo quando cada
pessoa envia apenas algumas solicitações. Entre sempre que possível e tente novamente após o
atraso informado.

## A pesquisa ou instalação falha atrás de um proxy

A CLI respeita variáveis de proxy padrão:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Os nomes compatíveis incluem `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` e
`http_proxy`.

## Uma Skill não aparece na pesquisa

- Verifique o slug exato ou a página do proprietário, se você souber.
- Confirme se a versão é pública e não está retida por varredura ou moderação.
- Se você é o proprietário da Skill, entre e inspecione-a:

```bash
clawhub inspect @openclaw/demo
```

Diagnósticos visíveis ao proprietário podem explicar o estado de varredura, bloqueio de upload ou moderação.

## A publicação falha porque metadados obrigatórios estão ausentes

Para Skills, verifique o frontmatter de `SKILL.md`. Variáveis de ambiente e
ferramentas obrigatórias devem ser declaradas para que usuários e scanners possam entender o pacote.

Para plugins, verifique os metadados de compatibilidade em `package.json`. Publicações de plugins de código
precisam de campos de compatibilidade do OpenClaw, como `openclaw.compat.pluginApi` e
`openclaw.build.openclawVersion`.

Visualize primeiro o payload de publicação:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## A publicação falha com um erro de proprietário ou origem do GitHub

O ClawHub usa a identidade do GitHub e a atribuição de origem para conectar pacotes a seus
publicadores.

- Verifique se você está conectado com a conta do GitHub que possui ou pode publicar
  o pacote.
- Verifique se a URL de origem é pública ou acessível ao ClawHub.
- Para origens do GitHub, use `owner/repo`, `owner/repo@ref` ou uma URL completa do GitHub.

## A publicação falha porque um namespace foi reivindicado ou reservado

Se uma publicação falhar porque o identificador do proprietário, namespace da organização, escopo do pacote, slug da Skill
ou nome do pacote já foi reivindicado ou reservado, primeiro confirme se você está
publicando com o proprietário correspondente ao namespace. Para pacotes de plugins,
nomes com escopo como `@example-org/example-plugin` devem ser publicados como o
proprietário `example-org` correspondente.

Se você acredita que sua organização, projeto ou marca é a proprietária legítima do namespace, mas
não consegue gerenciar o proprietário atual do ClawHub, abra uma
[issue de Reivindicação de Organização / Namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
com prova pública e não sensível. Consulte
[Reivindicações de Organização e Namespace](/pt-BR/clawhub/namespace-claims) para orientações sobre evidências e o que
manter fora de issues públicas.

## `sync` diz que nenhuma Skill foi encontrada

`sync` procura pastas que contenham `SKILL.md` ou `skill.md`.

Aponte-o para as raízes que você quer escanear:

```bash
clawhub sync --root /path/to/skills
```

Visualize primeiro se não tiver certeza do que será publicado:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` recusa por causa de alterações locais

Os arquivos locais não correspondem a nenhuma versão conhecida pelo ClawHub. Escolha uma opção:

- Mantenha as edições locais e ignore a atualização.
- Sobrescreva com a versão publicada:

```bash
clawhub update @openclaw/demo --force
```

- Publique sua cópia editada como um novo slug ou fork.

## A instalação de um Plugin falha no OpenClaw

- Use uma origem explícita do ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

- Verifique a página de detalhes do pacote para o status de varredura e os metadados de compatibilidade.
- Confirme se sua versão do OpenClaw satisfaz o intervalo de compatibilidade
  anunciado pelo pacote.
- Se o pacote estiver oculto, retido ou bloqueado, ele pode não ser instalável até que
  o proprietário resolva o problema.

## Solicitações de API pública falham

- Respeite os cabeçalhos de nova tentativa de `429` e armazene em cache respostas públicas de lista/pesquisa.
- Direcione os usuários de volta para a listagem canônica do ClawHub.
- Não espelhe conteúdo oculto, privado, retido ou bloqueado por moderação fora da
  superfície da API pública.

Consulte [API HTTP](/pt-BR/clawhub/http-api) para detalhes dos endpoints.
