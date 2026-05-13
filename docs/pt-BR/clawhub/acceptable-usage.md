---
read_when:
    - Analisando envios para detectar abuso ou violações de política
    - Escrevendo documentação de moderação ou guias operacionais para revisores
    - Decidindo se uma Skill deve ser ocultada ou um usuário banido
summary: 'Política da loja: o que o ClawHub permite e o que não hospedará.'
x-i18n:
    generated_at: "2026-05-13T02:51:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso aceitável

Esta página descreve os tipos de Skills e conteúdo que o ClawHub aceita, e os fluxos de abuso que ele não hospedará.

Estas regras são intencionalmente práticas. O que mais importa para nós são fluxos de abuso de ponta a ponta, não apenas palavras-chave isoladas. Se uma Skill for criada para burlar defesas, abusar de plataformas, aplicar golpes, invadir privacidade ou viabilizar comportamento sem consentimento, ela não pertence ao ClawHub.

## Padrões recentes que aceitamos explicitamente

- Trabalho de frontend e design system que usa componentes reais, tokens semânticos, estados acessíveis e fluxos de usuário testados.
- Composição com shadcn/ui que usa componentes-fonte instalados, aliases de projeto e variantes documentadas em vez de marcação pontual.
- Conversão de JavaScript para TypeScript em UI5 que preserva comentários, usa tipos concretos do UI5 e mantém interfaces de controles geradas revisáveis.
- Revisão de segurança defensiva, ferramentas de moderação e prompts de detecção de abuso que mostram evidências e mantêm claros os limites de aprovação humana.
- Automação de fluxos de trabalho baseada em consentimento para contas pessoais ou de equipe, com credenciais explícitas, configuração transparente e modos de execução simulada ou pré-visualização.
- Documentação, runbooks de migração, utilitários para desenvolvedores e fixtures de teste com escopo limitado ao software que oferecem suporte.

## Não aceitável

- Fluxos de bypass de segurança ou acesso não autorizado.
  - Exemplos: bypass de autenticação, tomada de conta, bypass de CAPTCHA, evasão do Cloudflare ou de sistemas anti-bot, bypass de limites de taxa, scraping furtivo projetado para derrotar proteções, tomada de chamada ao vivo ou de agente, roubo reutilizável de sessão, aprovação automática de fluxos de pareamento para usuários não aprovados.

- Abuso de plataforma e evasão de banimento.
  - Exemplos: contas furtivas após banimentos, aquecimento/cultivo de contas, engajamento falso, cultivo de karma ou seguidores, automação de múltiplas contas, postagem em massa, bots de spam, automação de marketplaces ou redes sociais criada para evitar detecção.

- Fraude, golpes e fluxos financeiros enganosos.
  - Exemplos: certificados falsos, faturas falsas, fluxos de pagamento enganosos, abordagens de golpe, prova social falsa, ferramentas que permitem gastar ou cobrar sem aprovação humana clara e controles transparentes, ou fluxos de identidade sintética criados para gerar contas para fraude.

- Scraping, enriquecimento ou vigilância invasivos à privacidade.
  - Exemplos: scraping de detalhes de contato em escala para spam, doxxing, perseguição, extração de leads combinada com abordagem não solicitada, monitoramento encoberto, busca facial ou correspondência biométrica usada sem consentimento claro, ou compra, publicação, download ou operacionalização de dados vazados ou dumps de violações.

- Personificação sem consentimento ou manipulação enganosa de identidade.
  - Exemplos: troca de rosto, gêmeos digitais, personas falsas, influenciadores clonados ou outras ferramentas de manipulação de identidade usadas para personificar ou enganar.

- Conteúdo sexual explícito e geração de conteúdo adulto com segurança desativada.
  - Exemplos: geração de imagens/vídeos/conteúdo NSFW, wrappers de conteúdo adulto em torno de APIs de terceiros, ou Skills cujo objetivo principal é conteúdo sexual explícito.

- Requisitos de execução ocultos, inseguros ou enganosos.
  - Exemplos: comandos de instalação ofuscados, `curl | sh`, requisitos de segredo não declarados, uso não declarado de chave privada, execução remota de `npx @latest` sem revisabilidade clara, metadados enganosos que ocultam do que a Skill realmente precisa para executar.

## Padrões recentes que explicitamente não aceitamos

- “Criar contas de vendedor furtivas após banimentos em marketplaces.”
- “Modificar o pareamento do Telegram para que usuários não aprovados recebam códigos de pareamento automaticamente.”
- “Cultivar contas no Reddit/Twitter com automação indetectável.”
- “Gerar certificados profissionais ou faturas para uso arbitrário.”
- “Gerar conteúdo NSFW com verificações de segurança desativadas.”
- “Coletar leads por scraping, enriquecer contatos e lançar abordagens frias em escala.”
- “Comprar, publicar ou baixar dados vazados ou dumps de violações.”
- “Criar em massa contas de e-mail ou redes sociais com identidades sintéticas ou resolução de CAPTCHA.”

## Observações para revisores

- O contexto importa. O mesmo tópico pode ser legítimo em um cenário defensivo restrito ou baseado em consentimento e inaceitável quando empacotado como um fluxo de abuso.
- Devemos tender à ação quando uma Skill for claramente otimizada para evasão, engano ou uso sem consentimento.
- Uploads repetidos nessas categorias são motivo para ocultar conteúdo e banir a conta.

## Aplicação

- Podemos ocultar, remover ou excluir permanentemente Skills em violação.
- Podemos revogar tokens, excluir de forma reversível conteúdo associado e banir infratores reincidentes ou graves.
- Não garantimos aplicação com aviso prévio para abusos óbvios.
