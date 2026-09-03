import { defineConfig } from "vitepress"

export default defineConfig({
  base: "/avalanche-docs/",
  lang: "en-US",
  title: "Avalanche Docs",
  description:
    "Documentation for Avalanche, an async availability-testing toolkit for authorized load and resilience assessments.",
  lastUpdated: true,
  cleanUrls: true,
  themeConfig: {
    logo: "/avalanche-docs/avalanche-mark.svg",
    siteTitle: "Avalanche Docs",
    nav: [
      { text: "Home", link: "/" },
      { text: "Getting Started", link: "/getting-started/introduction" },
      { text: "User Guide", link: "/user-guide/overview" },
      { text: "Attack Vectors", link: "/attack-vectors/overview" },
      { text: "Architecture", link: "/architecture/overview" },
      { text: "Developer Guide", link: "/developer/overview" },
    ],
    sidebar: {
      "/getting-started/": [
        {
          text: "Getting Started",
          items: [
            { text: "Introduction", link: "/getting-started/introduction" },
            { text: "Quick Start", link: "/getting-started/quickstart" },
            { text: "Installation", link: "/getting-started/installation" },
            { text: "System Requirements", link: "/getting-started/requirements" },
          ],
        },
      ],
      "/user-guide/": [
        {
          text: "User Guide",
          items: [
            { text: "Overview", link: "/user-guide/overview" },
            { text: "Modes of Operation", link: "/user-guide/modes" },
            { text: "Command-Line Interface", link: "/user-guide/cli" },
            { text: "Web Dashboard", link: "/user-guide/dashboard" },
            { text: "Presets", link: "/user-guide/presets" },
            { text: "Configuration", link: "/user-guide/configuration" },
            { text: "Playbooks", link: "/user-guide/playbooks" },
            { text: "Canary and Kill Switch", link: "/user-guide/canary-killswitch" },
            { text: "Safety and Authorized Use", link: "/user-guide/safety" },
            { text: "Engagements and Reports", link: "/user-guide/engagements-reports" },
            { text: "Maintaining This Documentation", link: "/user-guide/maintaining" },
          ],
        },
      ],
      "/attack-vectors/": [
        {
          text: "Attack Vectors",
          items: [
            { text: "Overview", link: "/attack-vectors/overview" },
            { text: "Vector Reference", link: "/attack-vectors/reference" },
            { text: "Layer 3 (Network)", link: "/attack-vectors/layer3" },
            { text: "Layer 4 (TCP/UDP)", link: "/attack-vectors/layer4" },
            { text: "Layer 7 (Application)", link: "/attack-vectors/layer7" },
            {
              text: "Vector Knowledge Base",
              items: [
                { text: "HTTP Flood (http)", link: "/attack-vectors/kb/vector-http" },
                { text: "HTTP Flow Player (http_flow)", link: "/attack-vectors/kb/vector-http-flow" },
                { text: "HTTP/2 (http2)", link: "/attack-vectors/kb/vector-http2" },
                { text: "HTTP/3 / QUIC (http3)", link: "/attack-vectors/kb/vector-http3" },
                { text: "WebSocket (websocket)", link: "/attack-vectors/kb/vector-websocket" },
                { text: "Slowloris (slowloris)", link: "/attack-vectors/kb/vector-slowloris" },
                { text: "RUDY (rudy)", link: "/attack-vectors/kb/vector-rudy" },
                { text: "Slow Read (slowread)", link: "/attack-vectors/kb/vector-slowread" },
                { text: "TLS Churn (tls_churn)", link: "/attack-vectors/kb/vector-tls-churn" },
                { text: "SMTP Slow Hold (smtp)", link: "/attack-vectors/kb/vector-smtp" },
                { text: "DNS Water Torture (dns)", link: "/attack-vectors/kb/vector-dns" },
                { text: "SIP (sip)", link: "/attack-vectors/kb/vector-sip" },
                { text: "UDP Storm and Amplification (udp)", link: "/attack-vectors/kb/vector-udp" },
                { text: "ICMP (icmp)", link: "/attack-vectors/kb/vector-icmp" },
                { text: "TCP SYN (syn)", link: "/attack-vectors/kb/vector-syn" },
                { text: "Raw IP (rawip)", link: "/attack-vectors/kb/vector-rawip" },
              ],
            },
          ],
        },
      ],
      "/reconnaissance/": [
        {
          text: "Reconnaissance",
          items: [
            { text: "Overview", link: "/reconnaissance/overview" },
            { text: "Subdomain Discovery", link: "/reconnaissance/subdomains" },
            { text: "Origin IP Finder", link: "/reconnaissance/origin-finder" },
            { text: "Endpoint Discovery", link: "/reconnaissance/endpoints" },
            { text: "Campaigns", link: "/reconnaissance/campaigns" },
            { text: "Cookie Capture", link: "/reconnaissance/cookie-capture" },
          ],
        },
      ],
      "/infrastructure/": [
        {
          text: "Infrastructure",
          items: [
            { text: "Overview", link: "/infrastructure/overview" },
            { text: "Proxy Pipeline", link: "/infrastructure/proxies" },
            { text: "Reflector Pipeline", link: "/infrastructure/reflectors" },
            { text: "Spoof Sources", link: "/infrastructure/spoof-sources" },
          ],
        },
      ],
      "/controls/": [
        {
          text: "Controls and Observability",
          items: [
            { text: "Overview", link: "/controls/overview" },
            { text: "Rate Limiting and Governor", link: "/controls/governor" },
            { text: "SLO Mode", link: "/controls/slo" },
            { text: "Adaptive Targeting", link: "/controls/adaptive-targeting" },
            { text: "Metrics", link: "/controls/metrics" },
            { text: "Checkpoint and Resume", link: "/controls/checkpoint" },
            { text: "Comparison", link: "/controls/comparison" },
          ],
        },
      ],
      "/distributed/": [
        {
          text: "Distributed Mode",
          items: [
            { text: "Overview", link: "/distributed/overview" },
            { text: "Controller", link: "/distributed/controller" },
            { text: "Agent", link: "/distributed/agent" },
            { text: "Capacity Benchmark", link: "/distributed/benchmark" },
          ],
        },
      ],
      "/architecture/": [
        {
          text: "Architecture",
          items: [
            { text: "Overview", link: "/architecture/overview" },
            { text: "Package Map", link: "/architecture/packages" },
            { text: "Engine Pipeline", link: "/architecture/engine" },
            { text: "Vector Architecture", link: "/architecture/vectors" },
            { text: "Configuration Model", link: "/architecture/config-model" },
            { text: "Emission and Statistics", link: "/architecture/emission" },
          ],
        },
      ],
      "/developer/": [
        {
          text: "Developer Guide",
          items: [
            { text: "Overview", link: "/developer/overview" },
            { text: "Project Layout", link: "/developer/project-layout" },
            { text: "Adding a Vector", link: "/developer/adding-a-vector" },
            { text: "Adding a Preset", link: "/developer/adding-a-preset" },
            { text: "Adding a Modifier", link: "/developer/adding-a-modifier" },
            { text: "Adding a Config Field", link: "/developer/adding-a-config-field" },
            { text: "WAF Bypass Methods", link: "/developer/waf-bypass-methods" },
            { text: "Testing", link: "/developer/testing" },
          ],
        },
      ],
      "/reference/": [
        {
          text: "Reference",
          items: [
            { text: "CLI Flags", link: "/reference/cli-flags" },
            { text: "Configuration Reference", link: "/reference/config-reference" },
            { text: "Data Files", link: "/reference/data-files" },
          ],
        },
      ],
    },
    outline: { level: [2, 3], label: "On this page" },
    socialLinks: [
      { icon: "github", link: "https://github.com/MundaneMann1776/avalanche-docs" },
    ],
    footer: {
      message: "Avalanche documentation. Authorized use only.",
      copyright: "Copyright © 2026 Mesut Yiğit Keleştimur",
    },
  },
})
