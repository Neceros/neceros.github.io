from django.contrib import messages
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.shortcuts import render, get_object_or_404
from .models import Post


# HOW YOU LOOK AT THE CONTENT/DATA SELECTION

# Good shit to remember:
# request.user.is_authenticated()
def posts_home(request):
    queryset = Post.objects.published()
    paginator = Paginator(queryset, 5)

    page = request.GET.get('page')

    try:
        newpage = paginator.page(page)
    except PageNotAnInteger:
        # If page is not an integer, deliver first page.
        newpage = paginator.page(1)
    except EmptyPage:
        # If page is out of range (e.g. 9999), deliver last page of results.
        newpage = paginator.page(paginator.num_pages)

    content = {
        "content": newpage
    }
    return render(request, "index.html", content)


def posts_detail(request, slug=None):
    queryset = get_object_or_404(Post, slug=slug)
    content = {
        "content": queryset,
        "title": queryset.title[0:20]
    }
    return render(request, "detail.html", content)
