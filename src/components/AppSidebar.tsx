import {
  Brain,
  FileText,
  Calendar,
  Users,
  ImageIcon,
  Zap,
  Upload,
  Coins,
  CreditCard,
  User,
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  FileDown,
  LogOut,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { GraduationCap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard },
  { title: "AI Tutor", url: "/app/tutor", icon: Brain },
  { title: "Criar Trabalho", url: "/app/criar-trabalho", icon: FileText },
  { title: "Meus Trabalhos", url: "/app/meus-trabalhos", icon: FileDown },
  { title: "Simulados", url: "/app/simulados", icon: ClipboardList },
  { title: "Resumos", url: "/app/resumos", icon: BookOpen },
];

const toolItems = [
  { title: "Smart Planner", url: "/app/planner", icon: Calendar },
  { title: "Quízio Rooms", url: "/app/rooms", icon: Users },
  { title: "Prova Amanhã", url: "/app/prova-amanha", icon: Zap },
  { title: "Upload Arquivos", url: "/app/upload", icon: Upload },
  { title: "Análise de Imagem", url: "/app/imagem", icon: ImageIcon },
];

const accountItems = [
  { title: "Tokens", url: "/app/tokens", icon: Coins },
  { title: "Planos", url: "/app/planos", icon: CreditCard },
  { title: "Perfil", url: "/app/perfil", icon: User },
];

function SidebarSection({ label, items, collapsed }: { label: string; items: typeof mainItems; collapsed: boolean }) {
  return (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end={item.url === "/app"}
                  className="hover:bg-sidebar-accent/50"
                  activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                >
                  <item.icon className="mr-2 h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const { signOut } = useAuth();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-hero flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && <span className="font-heading text-lg font-bold">Quízio AI</span>}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarSection label="Principal" items={mainItems} collapsed={collapsed} />
        <SidebarSection label="Ferramentas" items={toolItems} collapsed={collapsed} />
        <SidebarSection label="Conta" items={accountItems} collapsed={collapsed} />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={signOut} className="hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                  <LogOut className="mr-2 h-4 w-4 shrink-0" />
                  {!collapsed && <span>Sair</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
