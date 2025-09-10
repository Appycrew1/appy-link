const { data: prof } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .maybeSingle();
setIsAdmin(prof?.role === "admin");
