---
read_when:
    - Comandos da CLI do ClawHub ou do registro do OpenClaw falham
    - Um pacote não pode ser instalado, publicado ou atualizado
summary: Solução de problemas de login, instalação, publicação, sincronização, atualização e API do ClawHub.
x-i18n:
    generated_at: "2026-05-12T08:45:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Solução de problemas

## `clawhub login` abre um navegador, mas nunca conclui

A CLI inicia um servidor local de callback de curta duração durante o login pelo navegador.

- Certifique-se de que seu navegador consiga acessar `http://127.0.0.1:<port>/callback`.
- Verifique as regras de firewall local, VPN e proxy se o callback nunca chegar.
- Em ambientes sem interface gráfica, crie um token de API na interface web do ClawHub e execute:

```bash
clawhub login --token clh_...
```

## `whoami` ou `publish` retorna `Unauthorized` (401)

- Entre novamente com `clawhub login`.
- Se você usa um caminho de configuração personalizado, confirme que `CLAWHUB_CONFIG_PATH` aponta para o
  arquivo que contém seu token atual.
- Se você usa um token de API, confirme que ele não foi revogado na interface web.

## A busca ou instalação retorna `Rate limit exceeded` (429)

Leia as informações de nova tentativa na resposta:

- `Retry-After`: segundos a aguardar antes de tentar novamente.
- `RateLimit-Remaining` e `RateLimit-Limit`: seu orçamento atual.
- `RateLimit-Reset` ou `X-RateLimit-Reset`: momento de redefinição.

Se muitos usuários compartilham um IP de saída, os limites de IP anônimo podem ser atingidos mesmo quando cada
pessoa envia apenas algumas solicitações. Entre quando possível e tente novamente após o
atraso informado.

## A busca ou instalação falha atrás de um proxy

A CLI respeita variáveis de proxy padrão:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Os nomes compatíveis incluem `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` e
`http_proxy`.

## Uma skill não aparece na busca

- Verifique o slug exato ou a página do proprietário, se você souber.
- Confirme que a versão é pública e não está retida por verificação ou moderação.
- Se você é o proprietário da skill, entre e inspecione-a:

```bash
clawhub inspect <skill-slug>
```

Diagnósticos visíveis ao proprietário podem explicar o estado de verificação, bloqueio de upload ou moderação.

## A publicação falha porque metadados obrigatórios estão ausentes

Para Skills, verifique o frontmatter de `SKILL.md`. Variáveis de ambiente e
ferramentas obrigatórias devem ser declaradas para que usuários e verificadores possam entender o pacote.

Para plugins, verifique os metadados de compatibilidade em `package.json`. Publicações de code-plugin
precisam de campos de compatibilidade do OpenClaw, como `openclaw.compat.pluginApi` e
`openclaw.build.openclawVersion`.

Visualize primeiro a carga útil da publicação:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## A publicação falha com um erro de proprietário ou origem do GitHub

O ClawHub usa identidade do GitHub e atribuição de origem para conectar pacotes aos seus
publicadores.

- Certifique-se de estar conectado com a conta do GitHub que possui ou pode publicar
  o pacote.
- Verifique se a URL de origem é pública ou acessível para o ClawHub.
- Para origens do GitHub, use `owner/repo`, `owner/repo@ref` ou uma URL completa do GitHub.

## `sync` diz que nenhuma Skills foi encontrada

`sync` procura pastas que contenham `SKILL.md` ou `skill.md`.

Aponte-o para as raízes que você quer verificar:

```bash
clawhub sync --root /path/to/skills
```

Visualize primeiro se você não tem certeza do que será publicado:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` recusa por causa de alterações locais

Os arquivos locais não correspondem a nenhuma versão conhecida pelo ClawHub. Escolha uma opção:

- Mantenha as edições locais e ignore a atualização.
- Sobrescreva com a versão publicada:

```bash
clawhub update <slug> --force
```

- Publique sua cópia editada como um novo slug ou fork.

## Uma instalação de plugin falha no OpenClaw

- Use uma origem explícita do ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

- Verifique a página de detalhes do pacote para ver o estado de verificação e os metadados de compatibilidade.
- Confirme que sua versão do OpenClaw satisfaz o intervalo de compatibilidade
  anunciado pelo pacote.
- Se o pacote estiver oculto, retido ou bloqueado, ele pode não ser instalável até que
  o proprietário resolva o problema.

## Solicitações à API pública falham

- Respeite os cabeçalhos de nova tentativa `429` e armazene em cache respostas públicas de listagem/busca.
- Encaminhe os usuários de volta para a listagem canônica do ClawHub.
- Não espelhe conteúdo oculto, privado, retido ou bloqueado por moderação fora da
  superfície da API pública.

Consulte [API HTTP](/pt-BR/clawhub/http-api) para detalhes dos endpoints.
