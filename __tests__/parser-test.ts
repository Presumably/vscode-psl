import * as tokenizer from '../src/parser/tokenizer';
import * as parser from '../src/parser/parser';


function getMethod(methodString: string): parser.Method | undefined {
	let t = tokenizer.getTokens(methodString);
	let p = new parser.Parser(t);
	return p.parseMethod();
}
function getParsedDoc(documentString: string): parser.Parser {
	let p = new parser.Parser();
	p.parseDocument(documentString);
	return p;
}

function toValues(tokens: tokenizer.Token[]): string[] {
	return tokens.map(t => t.value);
}

function argsToValues(args: parser.Parameter[]): string[][] {
	return args.map(a => a.types).map(ts => toValues(ts));
}

function argsToNames(args: parser.Parameter[]): string[] {
	return toValues(args.map(a => a.id));
}

describe('Batch label', () => {
	let batchText = `---------- OPEN ------ Section marker

	type public Boolean ER
	type public Number BRCD
	type public String ET, RM

	do SOURCE^BCHSOURC("BOFF", "ACCUPD", .%UserID, .BRCD, .%UserClass)

	// ~p1 source not set up
	if ER set RM = $$^MSG(1184,"BOFF-ACCUPD"), %BatchExit = 1 do EXC quit`;

	let p = new parser.Parser();
	p.parseDocument(batchText);
	expect(p.methods).toHaveLength(1)
})

describe('Method Identifiers', () => {
	test('inline label statement symbol', () => {
		let methodString = 'label do something^SOMETHING';
		let result = getMethod(methodString);
		if (!result) {
			fail();
			return;
		}
		// let identifierValues = toValues(result.modifiers)
		expect(result.id.value).toEqual('label');
	});
	test('inline label statement keyword', () => {
		let methodString = 'label do something()';
		let result = getMethod(methodString);
		if (!result) {
			fail();
			return;
		}
		// let identifierValues = toValues(result.modifiers)
		expect(result.id.value).toEqual('label');
	});
	test('1 argument', () => {
		let methodString = 'public static void main(String args)';
		let result = getMethod(methodString);
		if (!result) {
			fail();
			return;
		}
		let identifierValues = toValues(result.modifiers)
		expect(identifierValues).toEqual(['public', 'static', 'void']);
	});

	test('2 arguments', () => {
		let methodString = 'public static void main(String arg1, String arg2)';
		let result = getMethod(methodString);
		if (!result) {
			fail();
			return;
		}
		let identifierValues = toValues(result.modifiers)
		expect(identifierValues).toEqual(['public', 'static', 'void']);
	});

	test('Label', () => {
		let methodString = 'main';
		let result = getMethod(methodString);
		if (!result) {
			fail();
			return;
		}
		// let identifierValues = toValues(result.modifiers)
		expect(result.id.value).toEqual('main');
	});

	test('Label from document', () => {
		let methodString = 'main\r\n';
		let result = getParsedDoc(methodString)
		if (!result) {
			fail();
			return;
		}
		expect(result.methods[0].id.value).toEqual('main')
	});

	test('Label with line comment', () => {
		let methodString = 'main // a comment';
		let result = getMethod(methodString);
		if (!result) {
			fail();
			return;
		}
		toValues(result.modifiers)
		expect(result.id.value).toEqual('main')
	});

	test('Label with parens', () => {
		let methodString = 'main()';
		let result = getMethod(methodString);
		if (!result) {
			fail();
			return;
		}
		toValues(result.modifiers)
		expect(result.id.value).toEqual('main')
	});

	test('Label with 1 argument', () => {
		let methodString = 'main(String x1)';
		let result = getMethod(methodString);
		if (!result) {
			fail();
			return;
		}
		toValues(result.modifiers)
		expect(result.id.value).toEqual('main')
	});

	test('Label with 2 arguments', () => {
		let methodString = 'main(String x1, String x2)';
		let result = getMethod(methodString);
		if (!result) {
			fail();
			return;
		}
		toValues(result.modifiers)
		expect(result.id.value).toEqual('main')
	});

	test('Label with 2 arguments multiline', () => {
		let methodString = 'main(String x1\n\t, String x2)';
		let result = getMethod(methodString);
		if (!result) {
			fail();
			return;
		}
		toValues(result.modifiers)
		expect(result.id.value).toEqual('main')
	});

	test('percent', () => {
		let methodString = 'public %main()';
		let p = new parser.Parser();
		p.parseDocument(methodString);
		expect(p.methods[0].id.value).toEqual('%main')
	});
})

describe('Argument Names', () => {

	test('1 argument', () => {
		let methodString = 'public static void main(String x1)';
		let result = getMethod(methodString);
		if (!result) {
			fail();
			return;
		}
		let argNameValues = argsToNames(result.parameters);
		expect(argNameValues).toEqual(['x1']);
	});

	test('2 arguments', () => {
		let methodString = 'public static void main(String x1, String x2)';
		let result = getMethod(methodString);
		if (!result) {
			fail();
			return;
		}
		let argNameValues = argsToNames(result.parameters);
		expect(argNameValues).toEqual(['x1', 'x2']);
	});

	test('1 argument multiline', () => {
		let methodString = 'public static void main(\n\tString x1)';
		let result = getMethod(methodString);
		if (!result) {
			fail();
			return;
		}
		let argNameValues = argsToNames(result.parameters);
		expect(argNameValues).toEqual(['x1']);
	});

	test('2 argument multiline', () => {
		let methodString = 'public static void main(String x1,\n\tString x2)';
		let result = getMethod(methodString);
		if (!result) {
			fail();
			return;
		}
		let argNameValues = argsToNames(result.parameters);
		expect(argNameValues).toEqual(['x1', 'x2']);
	});

	test('1 argument multitype', () => {
		let methodString = 'public static void main(void x1(Integer, Record))';
		let result = getMethod(methodString);
		if (!result) {
			fail();
			return;
		}
		let argNameValues = argsToNames(result.parameters);
		expect(argNameValues).toEqual(['x1']);
	});

	test('2 argument multitype', () => {
		let methodString = 'public static void main(void x1(Integer, Record), void x2(void, String))';
		let result = getMethod(methodString);
		if (!result) {
			fail();
			return;
		}
		let argNameValues = argsToNames(result.parameters);
		expect(argNameValues).toEqual(['x1', 'x2']);
	});

	test('2 argument multitype', () => {
		let methodString = 'public static void main(void x1(Integer, Record)\n\t, void x2(void, String))';
		let result = getMethod(methodString);
		if (!result) {
			fail();
			return;
		}
		let argNameValues = argsToNames(result.parameters);
		expect(argNameValues).toEqual(['x1', 'x2']);
	});

	test('test label with parens 1 arg', () => {
		let methodString = 'main(String x1)';
		let result = getMethod(methodString);
		if (!result) {
			fail();
			return;
		}
		let argNameValues = argsToNames(result.parameters);
		expect(argNameValues).toEqual(['x1']);
	});


	test('Label no args', () => {
		let methodString = 'main';
		let result = getMethod(methodString);
		if (!result) {
			fail();
			return;
		}
		let args = result.parameters;
		expect(args).toHaveLength(0);
	});

	test('Label with parens no args', () => {
		let methodString = 'main()'
		let result = getMethod(methodString);
		if (!result) {
			fail();
			return;
		}
		let args = result.parameters;
		expect(args).toHaveLength(0);
	});

	test('Label with multiline parens no args', () => {
		let methodString = 'main(\n\t)'
		let result = getMethod(methodString);
		if (!result) {
			fail();
			return;
		}
		let args = result.parameters;
		expect(args).toHaveLength(0);
	});
})

describe('Argument Types', () => {
	test('1 argument', () => {
		let methodString = 'public static void main(String x1)';
		let result = getMethod(methodString)
		if (!result) {
			fail();
			return;
		}
		let argValues = argsToValues(result.parameters);
		expect(argValues).toEqual([['String']]);
	});

	test('1 argument multitype', () => {
		let methodString = 'public static void main(String x1(Number))';
		let result = getMethod(methodString)
		if (!result) {
			fail();
			return;
		}
		let argValues = argsToValues(result.parameters);
		expect(argValues).toEqual([['String', 'Number']]);
	});

	test('test 2 argument types newline', () => {
		let methodString = 'public static void main(String x1 \n\t, Number x2)';
		let result = getMethod(methodString)
		if (!result) {
			fail();
			return;
		}
		let argValues = argsToValues(result.parameters);
		expect(argValues).toEqual([['String'], ['Number']]);
	});

	test('test 1 argument 3 types newline', () => {
		let methodString = 'public static void main(void x1(Integer, Record))';
		let result = getMethod(methodString)
		if (!result) {
			fail('Did not parse');
			return;
		}
		let argValues = argsToValues(result.parameters);
		expect(argValues).toEqual([['void', 'Integer', 'Record']]);
	});

	test('test 2 argument 3 types newline', () => {
		let methodString = 'public static void main(void x1(Integer, Record), void x2(void, String))';
		let result = getMethod(methodString)
		if (!result) {
			fail('Did not parse');
			return;
		}
		let argValues = argsToValues(result.parameters);
		expect(argValues).toEqual([['void', 'Integer', 'Record'], ['void', 'void', 'String']]);
	});
})

describe('Propertydefs', () => {
	test('empty propertydef', () => {
		let propertyString = '\t#PROPERTYDEF'
		let p = new parser.Parser();
		p.parseDocument(propertyString);
		expect(p.properties).toHaveLength(0);
	})

	test('one word propertydef', () => {
		let propertyString = '\t#PROPERTYDEF test'
		let p = new parser.Parser();
		p.parseDocument(propertyString);
		expect(p.properties).toHaveLength(1);
	})
})


test('parse document method count', () => {
	let documentString = `	#PACKAGE custom.core
	#CLASSDEF extends = Primitive public

	/*DOC -----------------------------------------------------------------
	Auto-generated by vscode-psl
	** ENDDOC */


	// --------------------------------------------------------------------
public final Integer toInteger()
	/*DOC -----------------------------------------------------------------
	convert Boolean to Integer
	** ENDDOC */
	do prim2prim^UCPRIM("Integer")
	quit


	// --------------------------------------------------------------------
public final Number toNumber()
	/*DOC -----------------------------------------------------------------
	convert Boolean to Number
	** ENDDOC */
	do prim2prim^UCPRIM("Number")
	quit


	// --------------------------------------------------------------------
public final String toString(String vMask)
	/*DOC -----------------------------------------------------------------
	convert Boolean to String
	** ENDDOC */
	do insMet^UCMETHOD("$$toString^PslNllBoolean(",1)
	quit
`

	let p = new parser.Parser();
	p.parseDocument(documentString);
	expect(p.methods).toHaveLength(3);
})

test('parse document method location', () => {
	let documentString = `	#PACKAGE custom.core
	#CLASSDEF extends = Primitive public

	/*DOC -----------------------------------------------------------------
	Auto-generated by vscode-psl
	** ENDDOC */


	// --------------------------------------------------------------------
public final Integer toInteger()
	/*DOC -----------------------------------------------------------------
	convert Boolean to Integer
	** ENDDOC */
	do prim2prim^UCPRIM("Integer")
	quit


	// --------------------------------------------------------------------
public final Number toNumber()
	/*DOC -----------------------------------------------------------------
	convert Boolean to Number
	** ENDDOC */
	do prim2prim^UCPRIM("Number")
	quit


	// --------------------------------------------------------------------
public final String toString(String vMask)
	/*DOC -----------------------------------------------------------------
	convert Boolean to String
	** ENDDOC */
	do insMet^UCMETHOD("$$toString^PslNllBoolean(",1)
	quit
`

	let p = new parser.Parser();
	p.parseDocument(documentString);
	expect(p.methods.map(method => method.line)).toEqual([9, 18, 27])
})

test('labels in document', () => {
	let documentString = `	#PACKAGE custom.core
	#CLASSDEF extends = Primitive public

	/*DOC -----------------------------------------------------------------
	Auto-generated by vscode-psl
	** ENDDOC */



toInteger
	/*DOC -----------------------------------------------------------------
	convert Boolean to Integer
	** ENDDOC */
	do prim2prim^UCPRIM("Integer")
	quit


	// --------------------------------------------------------------------
toNumber
	/*DOC -----------------------------------------------------------------
	convert Boolean to Number
	** ENDDOC */
	do prim2prim^UCPRIM("Number")
	quit


	// --------------------------------------------------------------------
toString
	/*DOC -----------------------------------------------------------------
	convert Boolean to String
	** ENDDOC */
	do insMet^UCMETHOD("$$toString^PslNllBoolean(",1)
	quit
`

	let p = new parser.Parser();
	p.parseDocument(documentString);
	expect(p.methods.map(method => method.id.value)).toEqual(['toInteger', 'toNumber', 'toString'])
	expect(p.methods.map(method => method.line)).toEqual([9, 18, 27])
})

test('parse methods with propertydef', () => {
	let documentString = `	#PACKAGE custom.core
	#CLASSDEF extends = Primitive public

	/*DOC -----------------------------------------------------------------
	Auto-generated by vscode-psl
	** ENDDOC */

	#PROPERTYDEF test class = String node = 1 public


	// --------------------------------------------------------------------
public final Integer toInteger()
	/*DOC -----------------------------------------------------------------
	convert Boolean to Integer
	** ENDDOC */
	do prim2prim^UCPRIM("Integer")
	quit


	// --------------------------------------------------------------------
public final Number toNumber()
	/*DOC -----------------------------------------------------------------
	convert Boolean to Number
	** ENDDOC */
	do prim2prim^UCPRIM("Number")
	quit


	// --------------------------------------------------------------------
public final String toString(String vMask)
	/*DOC -----------------------------------------------------------------
	convert Boolean to String
	** ENDDOC */
	do insMet^UCMETHOD("$$toString^PslNllBoolean(",1)
	quit
`

	let p = new parser.Parser();
	p.parseDocument(documentString);
	expect(p.methods).toHaveLength(3);
})

test('parse methods with propertydef count', () => {
	let documentString = `	#PACKAGE custom.core
	#CLASSDEF extends = Primitive public

	/*DOC -----------------------------------------------------------------
	Auto-generated by vscode-psl
	** ENDDOC */

	#PROPERTYDEF test class = String node = 1 public


	// --------------------------------------------------------------------
public final Integer toInteger()
	/*DOC -----------------------------------------------------------------
	convert Boolean to Integer
	** ENDDOC */
	do prim2prim^UCPRIM("Integer")
	quit


	// --------------------------------------------------------------------
public final Number toNumber()
	/*DOC -----------------------------------------------------------------
	convert Boolean to Number
	** ENDDOC */
	do prim2prim^UCPRIM("Number")
	quit


	// --------------------------------------------------------------------
public final String toString(String vMask)
	/*DOC -----------------------------------------------------------------
	convert Boolean to String
	** ENDDOC */
	do insMet^UCMETHOD("$$toString^PslNllBoolean(",1)
	quit
`

	let p = new parser.Parser();
	p.parseDocument(documentString);
	expect(p.properties).toHaveLength(1)

})

test('parse methods with propertydef count', () => {
	let documentString = `	#PACKAGE custom.core
	#CLASSDEF extends = Primitive public

	/*DOC -----------------------------------------------------------------
	Auto-generated by vscode-psl
	** ENDDOC */

	#PROPERTYDEF test class = String node = 1 public


	// --------------------------------------------------------------------
public final Integer toInteger()
	/*DOC -----------------------------------------------------------------
	convert Boolean to Integer
	** ENDDOC */
	do prim2prim^UCPRIM("Integer")
	quit


	// --------------------------------------------------------------------
public final Number toNumber()
	/*DOC -----------------------------------------------------------------
	convert Boolean to Number
	** ENDDOC */
	do prim2prim^UCPRIM("Number")
	quit


	// --------------------------------------------------------------------
public final String toString(String vMask)
	/*DOC -----------------------------------------------------------------
	convert Boolean to String
	** ENDDOC */
	do insMet^UCMETHOD("$$toString^PslNllBoolean(",1)
	quit
`

	let p = new parser.Parser();
	p.parseDocument(documentString);
	expect(toValues(p.properties[0].modifiers)).toEqual(['class', '=', 'String', 'node', '=', '1', 'public'])
	expect(p.properties[0].id.value).toEqual('test')

})

describe('type declarations', () => {
	test('basic type declaration', () => {
		let declarationString = 'type public literal String x = "hi there"'
		let p = new parser.Parser()
		let t = tokenizer.getTokens(declarationString)
		let tokenBuffer = [];
		for (let token of t) {
			tokenBuffer.push(token);
		}
		let declaration = p.lookForTypeDeclaration(tokenBuffer);
		if (!declaration) {
			fail('No declarations')
			return;
		}
		expect(declaration[0].types[0].value).toEqual('String')
		expect(declaration[0].id.value).toEqual('x')
	})
	test('mutliple type declaration', () => {
		let declarationString = 'type public literal String x,y'
		let p = new parser.Parser()
		let t = tokenizer.getTokens(declarationString)
		let tokenBuffer = [];
		for (let token of t) {
			tokenBuffer.push(token);
		}
		let declaration = p.lookForTypeDeclaration(tokenBuffer);
		if (!declaration) {
			fail('No declarations')
			return;
		}
		expect(declaration[0].types[0].value).toEqual('String')
		expect(declaration[0].id.value).toEqual('x')
		expect(declaration[1].types[0].value).toEqual('String')
		expect(declaration[1].id.value).toEqual('y')
	})
	test('mutliple multitype type declaration', () => {
		let declarationString = 'type public literal String x(Number,Boolean),y'
		let p = new parser.Parser()
		let t = tokenizer.getTokens(declarationString)
		let tokenBuffer = [];
		for (let token of t) {
			tokenBuffer.push(token);
		}
		let declaration = p.lookForTypeDeclaration(tokenBuffer);
		if (!declaration) {
			fail('No declarations')
			return;
		}
		expect(declaration[0].types[0].value).toEqual('String')
		expect(declaration[0].types[1].value).toEqual('Number')
		expect(declaration[0].types[2].value).toEqual('Boolean')
		expect(declaration[0].id.value).toEqual('x')
		expect(declaration[1].types[0].value).toEqual('String')
		expect(declaration[1].id.value).toEqual('y')
	})
	test('mutliple type declaration equal sign', () => {
		let declarationString = 'type String x = "hi", y = "hi"'
		let p = new parser.Parser()
		let t = tokenizer.getTokens(declarationString)
		let tokenBuffer = [];
		for (let token of t) {
			tokenBuffer.push(token);
		}
		let declaration = p.lookForTypeDeclaration(tokenBuffer);
		if (!declaration) {
			fail('No declarations')
			return;
		}
		expect(declaration[0].types[0].value).toEqual('String')
		expect(declaration[0].id.value).toEqual('x')
		expect(declaration[1].types[0].value).toEqual('String')
		expect(declaration[1].id.value).toEqual('y')
	})
	test('static type declaration', () => {
		let declarationString = 'type static x'
		let p = new parser.Parser()
		let t = tokenizer.getTokens(declarationString)
		let tokenBuffer = [];
		for (let token of t) {
			tokenBuffer.push(token);
		}
		let declaration = p.lookForTypeDeclaration(tokenBuffer);
		if (!declaration) {
			fail('No declarations')
			return;
		}
		expect(declaration[0].types[0].value).toEqual('x')
		expect(declaration[0].id.value).toEqual('x')
	})

	test ('method declarations', () => {
		let documentString = `
public static void main()
	type String x
	quit

public static void main2()
	type Number y
	quit
`
		let p = new parser.Parser();
		p.parseDocument(documentString);
		expect(p.methods[0].declarations[0].id.value).toEqual('x')
		expect(p.methods[1].declarations[0].id.value).toEqual('y')
	})
})