$(document).ready(function() {

    var btnSubmit = $(element).parent().prev().find("#submt");

    $(btnSubmit).click(function() {
        //var ids = $('getId').val();
        var ids = $(element).parent().prev().find("#getID");
        alert(ids);

        $.ajax({
            url: 'rtrv_pass.php',
            type: 'post'
            //data:{uid:},
        });
    });
});