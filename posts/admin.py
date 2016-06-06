from django.db.models import TextField
from django.contrib import admin
from pagedown.widgets import AdminPagedownWidget

from .models import Post, Tag


class PostAdmin(admin.ModelAdmin):
    class Meta:
        model = Post

    list_display = ["title", "created"]
    list_filter = ["created", "updated"]
    search_fields = ["title", "content"]
    prepopulated_fields = {"slug": ("title",)}
    formfield_overrides = {TextField: {'widget': AdminPagedownWidget}}

admin.site.register(Post, PostAdmin)
admin.site.register(Tag)
